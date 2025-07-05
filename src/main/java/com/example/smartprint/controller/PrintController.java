package com.example.smartprint.controller;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.*;
import com.example.smartprint.service.FileStorageService;
import com.example.smartprint.service.PrintService;
import com.example.smartprint.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.example.smartprint.dto.PrintJobDTO;
import java.util.Optional;

@Controller
@RequestMapping("/api/print")
public class PrintController {
    private final PrintService printService;
    private final FileStorageService fileStorageService;
    private final PrintJobRepository printJobRepository;
    private final PrinterRepository printerRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public PrintController(PrintService printService, FileStorageService fileStorageService, PrintJobRepository printJobRepository, PrinterRepository printerRepository, UserRepository userRepository, UserService userService) {
        this.printService = printService;
        this.fileStorageService = fileStorageService;
        this.printJobRepository = printJobRepository;
        this.printerRepository = printerRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @ResponseBody
    @PostMapping
    public ResponseEntity<?> submitPrintJob(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam Long printerId,
            @RequestParam DeliveryOption deliveryOption,
            @RequestParam PrintType printType,
            @RequestParam(required = false) PageSize pageSize,
            @RequestParam(required = false) Orientation orientation,
            @RequestParam(defaultValue = "1") int copyCount
    ) {
        try {
            // Validate input
            if (files.length == 0) {
                return createErrorResponse("No files provided", HttpStatus.BAD_REQUEST);
            }
            
            // Validate copy count
            if (copyCount < 1 || copyCount > 100) {
                return createErrorResponse("Copy count must be between 1 and 100", HttpStatus.BAD_REQUEST);
            }
            
            // 1. Get printer
            Printer printer = printerRepository.findById(printerId)
                    .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + printerId));

            // Check if printer is online
            if (printer.getStatus() != PrinterStatus.ONLINE) {
                return createErrorResponse("Printer is currently " + printer.getStatus() + ". Please select another printer.", 
                        HttpStatus.BAD_REQUEST);
            }

            // 2. Get current user and check balance
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return createErrorResponse("User not authenticated", HttpStatus.UNAUTHORIZED);
            }
            
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

            // 3. Store files
            List<String> filePaths = Arrays.stream(files)
                    .map(file -> {
                        try {
                            return fileStorageService.storeFile(file);
                        } catch (IOException e) {
                            throw new RuntimeException("File storage failed: " + e.getMessage());
                        }
                    })
                    .toList();

            // 4. Calculate total pages and cost
            int totalPages = 0;
            for (String filePath : filePaths) {
                File pdfFile = new File(filePath);
                try {
                    totalPages += printService.countPdfPages(pdfFile);
                } catch (IOException e) {
                    throw new RuntimeException("Error counting PDF pages: " + e.getMessage());
                }
            }
            
            // Calculate cost based on printer rates, print type, and copy count
            double pageRate = (printType == PrintType.COLOR) ? 
                printer.getColorRate() : printer.getBlackAndWhiteRate();
            double totalCost = pageRate * totalPages * copyCount;

            // 5. Check if user has sufficient balance
            if (!userService.hasSufficientBalance(currentUser, totalCost)) {
                return createErrorResponse("Insufficient balance. Required: ৳" + String.format("%.2f", totalCost) + 
                    ", Available: ৳" + String.format("%.2f", currentUser.getBalance()), HttpStatus.BAD_REQUEST);
            }

            // 6. Create print job
            PrintJob job = new PrintJob();
            job.setUser(currentUser);
            job.setFilePaths(filePaths);
            job.setPrinter(printer);
            job.setDeliveryOption(deliveryOption);
            job.setPrintType(printType);
            job.setCopyCount(copyCount);

            // Explicitly set PageSize and Orientation, defaulting if null
            job.setPageSize(Optional.ofNullable(pageSize).orElse(PageSize.A4));
            job.setOrientation(Optional.ofNullable(orientation).orElse(Orientation.PORTRAIT));
            
            job.setStatus(PrintJobStatus.PENDING);
            job.setCreatedAt(LocalDateTime.now());
            job.setDocumentName(files[0].getOriginalFilename() + (files.length > 1 ? " and others" : ""));
            job.setTotalPages(totalPages);
            job.setTotalCost(totalCost);

            // 7. Deduct balance from user
            userService.deductBalance(currentUser, totalCost);

            // 8. Save print job to get an ID
            PrintJob savedJob = printJobRepository.save(job);

            // 9. Send to Raspberry Pi. This will update the job with the cupsJobId.
            printService.sendToPrinter(savedJob);

            // 10. Re-fetch the job from the database to ensure we have the most
            // up-to-date and complete entity, including the cupsJobId. This prevents
            // issues with detached entities and ensures the response is accurate.
            PrintJob finalJob = printJobRepository.findById(savedJob.getId())
                    .orElseThrow(() -> new RuntimeException("Could not find the job just created. ID: " + savedJob.getId()));

            return ResponseEntity.ok(PrintJobDTO.fromEntity(finalJob));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Error processing print job: " + e.getMessage(), 
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping("/calculate")
    @ResponseBody
    public ResponseEntity<?> calculatePrintCost(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam Long printerId,
            @RequestParam PrintType printType,
            @RequestParam(defaultValue = "1") int copyCount
    ) {
        try {
            if (files.length == 0) {
                return createErrorResponse("No files provided", HttpStatus.BAD_REQUEST);
            }
            
            Printer printer = printerRepository.findById(printerId)
                    .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + printerId));

            int totalPages = 0;
            for (MultipartFile file : files) {
                if (!"application/pdf".equals(file.getContentType())) {
                     return createErrorResponse("Only PDF files are accepted for cost calculation.", HttpStatus.BAD_REQUEST);
                }
                String filePath = fileStorageService.storeFile(file);
                totalPages += printService.countPdfPages(new File(filePath));
                // Clean up the temporary file
                fileStorageService.deleteFile(filePath);
            }

            double pageRate = (printType == PrintType.COLOR) ? 
                printer.getColorRate() : printer.getBlackAndWhiteRate();
            double totalCost = pageRate * totalPages * copyCount;

            Map<String, Object> response = new HashMap<>();
            response.put("cost", totalCost);
            response.put("totalPages", totalPages);
            response.put("copyCount", copyCount);
            response.put("costPerCopy", totalCost / copyCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Error calculating cost: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/jobs/{id}")
    @ResponseBody
    public ResponseEntity<?> getJobStatus(@PathVariable Long id) {
        PrintJob job = printJobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        // Optionally, you can trigger an update check here as well, 
        // though the primary polling should be from the frontend.
        printService.updateJobStatus(job);

        // Re-fetch the job to get the latest status
        PrintJob updatedJob = printJobRepository.findById(id).get();

        return ResponseEntity.ok(PrintJobDTO.fromEntity(updatedJob));
    }
    
    @GetMapping("/jobs")
    @ResponseBody
    public ResponseEntity<List<PrintJobDTO>> getAllJobs() {
        List<PrintJob> jobs = printJobRepository.findAll();
        List<PrintJobDTO> dtos = jobs.stream()
                .map(PrintJobDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    private ResponseEntity<Map<String, String>> createErrorResponse(String message, HttpStatus status) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        errorResponse.put("status", status.toString());
        return new ResponseEntity<>(errorResponse, status);
    }
}