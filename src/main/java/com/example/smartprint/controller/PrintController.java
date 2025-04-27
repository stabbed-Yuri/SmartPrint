package com.example.smartprint.controller;

import com.example.smartprint.persistent.*;
import com.example.smartprint.repository.*;
import com.example.smartprint.service.FileStorageService;
import com.example.smartprint.service.PrintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/print")

public class PrintController {
    private final PrintService printService;
    private final FileStorageService fileStorageService;
    private final PrintJobRepository printJobRepository;

    public PrintController(PrintService printService, FileStorageService fileStorageService, PrintJobRepository printJobRepository, PrinterRepository printerRepository) {
        this.printService = printService;
        this.fileStorageService = fileStorageService;
        this.printJobRepository = printJobRepository;
        this.printerRepository = printerRepository;
    }

    private final PrinterRepository printerRepository;

    @PostMapping
    public ResponseEntity<?> submitPrintJob(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam Long printerId,
            @RequestParam DeliveryOption deliveryOption
    ) {
        // 1. Get printer
        Printer printer = printerRepository.findById(printerId)
                .orElseThrow(() -> new RuntimeException("Printer not found"));

        // 2. Store files
        List<String> filePaths = Arrays.stream(files)
                .map(file -> {
                    try {
                        return fileStorageService.storeFile(file);
                    } catch (IOException e) {
                        throw new RuntimeException("File storage failed");
                    }
                })
                .toList();

        // 3. Create print job
        PrintJob job = new PrintJob();
        User currentUser = null;
        job.setUser(currentUser);
        job.setFilePaths(filePaths);
        job.setPrinter(printer);
        job.setDeliveryOption(deliveryOption);
        job.setStatus("QUEUED");

        // 4. Calculate total pages (example implementation)
        int totalPages = files.length * 2; // Replace with actual PDF page counting
        job.setTotalPages(totalPages);
        job.setTotalCost(printer.getCostPerPage() * totalPages);

        PrintJob savedJob = printJobRepository.save(job);

        // 5. Send to Raspberry Pi
        printService.sendToPrinter(savedJob);

        return ResponseEntity.ok(savedJob);
    }
}