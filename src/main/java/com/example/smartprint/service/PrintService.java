package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.PrinterRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import com.example.smartprint.dto.PiPrintResponseDTO;
import com.example.smartprint.dto.PiJobStatusDTO;

@Service
public class PrintService {
    private final RestTemplate restTemplate;
    private final FileStorageService fileStorageService;
    private final PrintJobRepository printJobRepository;

    @Autowired
    public PrintService(RestTemplate restTemplate, FileStorageService fileStorageService, PrintJobRepository printJobRepository) {
        this.restTemplate = restTemplate;
        this.fileStorageService = fileStorageService;
        this.printJobRepository = printJobRepository;
    }

    private void ensureMutableFilePaths(PrintJob job) {
        if (job.getFilePaths() != null && !(job.getFilePaths() instanceof java.util.ArrayList)) {
            job.setFilePaths(new ArrayList<>(job.getFilePaths()));
        }
    }

    public void sendToPrinter(PrintJob job) {
        Printer printer = job.getPrinter();
        if (printer.getIpAddress() == null || printer.getIpAddress().isEmpty()) {
            throw new IllegalArgumentException("Printer '" + printer.getName() + "' does not have an IP address configured.");
        }
        String piEndpoint = "http://" + printer.getIpAddress() + ":5000/print";

        // This is a temporary fix to handle only the first file, as the Pi script
        // only accepts one file at a time. A proper fix would involve zipping files
        // or allowing multiple file parts in the Pi script.
        String firstFilePath = job.getFilePaths().stream().findFirst().orElse(null);
        if (firstFilePath == null) {
            // No files to print, just return.
            return;
        }

        try {
            File file = new File(firstFilePath);
            byte[] fileContent = Files.readAllBytes(file.toPath());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(fileContent) {
                @Override
                public String getFilename() {
                    return file.getName();
                }
            });
            body.add("copies", job.getCopyCount());
            body.add("orientation", job.getOrientation().toString());
            body.add("color", job.getPrintType() == PrintType.COLOR);
            body.add("media", job.getPageSize().toString());

            ResponseEntity<PiPrintResponseDTO> response = restTemplate.postForEntity(
                    piEndpoint,
                    new HttpEntity<>(body, headers),
                    PiPrintResponseDTO.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String cupsJobId = response.getBody().getCupsJobId();
                if (cupsJobId != null && !cupsJobId.isEmpty()) {
                    job.setCupsJobId(cupsJobId);
                    // Ensure filePaths is mutable before saving
                    ensureMutableFilePaths(job);
                    // Save the job with the new CUPS ID
                    printJobRepository.save(job);
                }
            } else {
                // If the response is not successful, or body is null, throw an exception
                String errorDetails = response.getBody() != null ? response.getBody().getDetails() : "Unknown error from printer API";
                throw new RuntimeException("Failed to send job to printer: " + errorDetails);
            }

        } catch (IOException e) {
            throw new RuntimeException("File send failed: " + e.getMessage());
        }
    }

    public void updateJobStatus(PrintJob job) {
        if (job.getCupsJobId() == null || job.getCupsJobId().isEmpty()) {
            return; // Cannot check status without a CUPS job ID
        }

        Printer printer = job.getPrinter();
        String piEndpoint = "http://" + printer.getIpAddress() + ":5000/job_status/" + job.getCupsJobId();

        try {
            ResponseEntity<PiJobStatusDTO> response = restTemplate.getForEntity(piEndpoint, PiJobStatusDTO.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                PiJobStatusDTO statusDTO = response.getBody();
                String piStatus = statusDTO.getStatus();
                PrintJobStatus newStatus = null;
                if (piStatus == null) return;
                switch (piStatus.toUpperCase()) {
                    case "PENDING":
                        newStatus = PrintJobStatus.PENDING;
                        break;
                    case "PRINTING":
                    case "PROCESSING":
                        newStatus = PrintJobStatus.PRINTING;
                        break;
                    case "COMPLETED":
                        newStatus = PrintJobStatus.COMPLETED;
                        break;
                    case "CANCELLED":
                        newStatus = PrintJobStatus.CANCELLED;
                        break;
                    case "FAILED":
                    case "ABORTED":
                        newStatus = PrintJobStatus.FAILED;
                        break;
                    default:
                        // Optionally handle unknown statuses
                        break;
                }
                if (newStatus != null && job.getStatus() != newStatus) {
                    job.setStatus(newStatus);
                    if (newStatus == PrintJobStatus.COMPLETED || newStatus == PrintJobStatus.CANCELLED || newStatus == PrintJobStatus.FAILED) {
                        job.setCompletedAt(LocalDateTime.now());
                    }
                    printJobRepository.save(job);
                }
            }
        } catch (Exception e) {
            // Log the error but don't throw, as this might be a transient network issue
            System.err.println("Could not update job status for job " + job.getId() + ": " + e.getMessage());
        }
    }
    
    public int countPdfPages(File pdfFile) throws IOException {
        if (!pdfFile.exists()) {
            throw new IOException("PDF file does not exist: " + pdfFile.getPath());
        }
        
        if (pdfFile.length() == 0) {
            throw new IOException("PDF file is empty: " + pdfFile.getPath());
        }
        
        try (PDDocument document = PDDocument.load(pdfFile)) {
            if (document.isEncrypted()) {
                throw new IOException("Cannot process encrypted PDF: " + pdfFile.getPath());
            }
            return document.getNumberOfPages();
        } catch (IOException e) {
            throw new IOException("Error reading PDF file: " + e.getMessage(), e);
        }
    }
    
    public PrintJob createPrintJob(User user, Printer printer, MultipartFile[] files, DeliveryOption deliveryOption, PrintType printType) {
        try {
            // Store files and get paths
            List<String> filePaths = new ArrayList<>();
            int totalPages = 0;
            
            for (MultipartFile file : files) {
                // Validate file is PDF
                if (!file.getContentType().equals("application/pdf")) {
                    throw new IllegalArgumentException("Only PDF files are accepted");
                }
                
                // Store file
                String filePath = fileStorageService.storeFile(file);
                filePaths.add(filePath);
                
                // Count pages
                File pdfFile = new File(filePath);
                totalPages += countPdfPages(pdfFile);
            }
            
            // Calculate cost based on printer rates and print type
            double pageRate = (printType == PrintType.COLOR) ? 
                printer.getColorRate() : printer.getBlackAndWhiteRate();
            double totalCost = pageRate * totalPages;
            
            // Create print job
            PrintJob printJob = new PrintJob();
            printJob.setUser(user);
            printJob.setPrinter(printer);
            // Ensure filePaths is always a mutable list
            printJob.setFilePaths(new ArrayList<>(filePaths));
            printJob.setStatus(PrintJobStatus.PENDING);
            printJob.setCreatedAt(LocalDateTime.now());
            printJob.setTotalPages(totalPages);
            printJob.setTotalCost(totalCost);
            printJob.setPrintType(printType);
            printJob.setDeliveryOption(deliveryOption);
            printJob.setDocumentName(files[0].getOriginalFilename() + (files.length > 1 ? " and others" : ""));
            
            // Set default page size to A4
            printJob.setPageSize(PageSize.A4);
            
            // Set default orientation to PORTRAIT
            printJob.setOrientation(Orientation.PORTRAIT);
            
            // Save to database
            return printJobRepository.save(printJob);
        } catch (IOException e) {
            throw new RuntimeException("Error processing files: " + e.getMessage());
        }
    }
}