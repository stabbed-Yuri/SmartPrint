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

@Controller
@RequestMapping("/api/print")
public class PrintController {
    private final PrintService printService;
    private final FileStorageService fileStorageService;
    private final PrintJobRepository printJobRepository;
    private final PrinterRepository printerRepository;
    private final UserRepository userRepository;

    public PrintController(PrintService printService, FileStorageService fileStorageService, PrintJobRepository printJobRepository, PrinterRepository printerRepository, UserRepository userRepository) {
        this.printService = printService;
        this.fileStorageService = fileStorageService;
        this.printJobRepository = printJobRepository;
        this.printerRepository = printerRepository;
        this.userRepository = userRepository;
    }

    @ResponseBody
    @PostMapping
    public ResponseEntity<?> submitPrintJob(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam Long printerId,
            @RequestParam DeliveryOption deliveryOption,
            @RequestParam PrintType printType,
            @RequestParam(required = false) PageSize pageSize
    ) {
        try {
            // Validate input
            if (files.length == 0) {
                return createErrorResponse("No files provided", HttpStatus.BAD_REQUEST);
            }
            
            // 1. Get printer
            Printer printer = printerRepository.findById(printerId)
                    .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + printerId));

            // 2. Store files
            List<String> filePaths = Arrays.stream(files)
                    .map(file -> {
                        try {
                            return fileStorageService.storeFile(file);
                        } catch (IOException e) {
                            throw new RuntimeException("File storage failed: " + e.getMessage());
                        }
                    })
                    .toList();

            // 3. Create print job
            PrintJob job = new PrintJob();
            
            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
                job.setUser(currentUser);
            } else {
                return createErrorResponse("User not authenticated", HttpStatus.UNAUTHORIZED);
            }
            
            job.setFilePaths(filePaths);
            job.setPrinter(printer);
            job.setDeliveryOption(deliveryOption);
            job.setPrintType(printType);
            if (pageSize != null) {
                job.setPageSize(pageSize);
            } else {
                job.setPageSize(PageSize.A4);
            }
            // Set default orientation to PORTRAIT
            job.setOrientation(Orientation.PORTRAIT);
            job.setStatus(PrintJobStatus.PENDING);
            job.setCreatedAt(LocalDateTime.now());
            job.setDocumentName(files[0].getOriginalFilename() + (files.length > 1 ? " and others" : ""));

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
            
            job.setTotalPages(totalPages);
            
            // Calculate cost based on printer rates and print type
            double pageRate = (printType == PrintType.COLOR) ? 
                printer.getColorRate() : printer.getBlackAndWhiteRate();
            job.setTotalCost(pageRate * totalPages);

            PrintJob savedJob = printJobRepository.save(job);

            // 5. Send to Raspberry Pi
            printService.sendToPrinter(savedJob);

            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            return createErrorResponse("Error processing print job: " + e.getMessage(), 
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @ResponseBody
    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePrintCost(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam Long printerId,
            @RequestParam PrintType printType
    ) {
        try {
            // Validate input
            if (files.length == 0) {
                return createErrorResponse("No files provided", HttpStatus.BAD_REQUEST);
            }
            
            // Check if all files are PDFs
            for (MultipartFile file : files) {
                if (!file.getContentType().equals("application/pdf")) {
                    return createErrorResponse("Only PDF files are accepted", HttpStatus.BAD_REQUEST);
                }
            }
            
            // Get printer
            Printer printer = printerRepository.findById(printerId)
                    .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + printerId));
            
            // Store files temporarily
            List<String> filePaths = Arrays.stream(files)
                    .map(file -> {
                        try {
                            return fileStorageService.storeFile(file);
                        } catch (IOException e) {
                            throw new RuntimeException("File storage failed: " + e.getMessage());
                        }
                    })
                    .toList();
            
            // Calculate total pages
            int totalPages = 0;
            for (String filePath : filePaths) {
                File pdfFile = new File(filePath);
                try {
                    totalPages += printService.countPdfPages(pdfFile);
                } catch (IOException e) {
                    throw new RuntimeException("Error counting PDF pages: " + e.getMessage());
                }
            }
            
            // Calculate cost
            double pageRate = (printType == PrintType.COLOR) ? 
                printer.getColorRate() : printer.getBlackAndWhiteRate();
            double totalCost = pageRate * totalPages;
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("totalPages", totalPages);
            response.put("pageRate", pageRate);
            response.put("totalCost", totalCost);
            response.put("currency", "BDT");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return createErrorResponse("Error calculating print cost: " + e.getMessage(), 
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private ResponseEntity<Map<String, String>> createErrorResponse(String message, HttpStatus status) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        response.put("status", status.toString());
        return new ResponseEntity<>(response, status);
    }
}