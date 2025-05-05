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
import java.io.IOException;
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
            @RequestParam DeliveryOption deliveryOption
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
            job.setStatus(PrintJobStatus.PENDING);

            // 4. Calculate total pages (example implementation)
            int totalPages = files.length * 2; // Replace with actual PDF page counting
            job.setTotalPages(totalPages);
            job.setTotalCost(printer.getBlackAndWhiteRate() * totalPages);

            PrintJob savedJob = printJobRepository.save(job);

            // 5. Send to Raspberry Pi
            printService.sendToPrinter(savedJob);

            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            return createErrorResponse("Error processing print job: " + e.getMessage(), 
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