package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.PrinterRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    public void sendToPrinter(PrintJob job) {
        Printer printer = job.getPrinter();
        String piEndpoint = "http://" + printer.getIpAddress() + ":5000/print";

        job.getFilePaths().forEach(filePath -> {
            try {
                File file = new File(filePath);
                byte[] fileContent = Files.readAllBytes(file.toPath());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);

                restTemplate.postForEntity(
                        piEndpoint,
                        new HttpEntity<>(fileContent, headers),
                        String.class
                );
            } catch (IOException e) {
                throw new RuntimeException("File send failed: " + e.getMessage());
            }
        });
    }
    
    public int countPdfPages(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            return document.getNumberOfPages();
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
            printJob.setFilePaths(filePaths);
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