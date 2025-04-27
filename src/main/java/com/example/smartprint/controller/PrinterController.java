package com.example.smartprint.controller;

import com.example.smartprint.persistent.PrintJob;
import com.example.smartprint.persistent.Printer;
import com.example.smartprint.service.PrinterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/printers")

public class PrinterController {
    private final PrinterService printerService;

    public PrinterController(PrinterService printerService) {
        this.printerService = printerService;
    }

    @PostMapping
    public ResponseEntity<Printer> addPrinter(@RequestBody Printer printer) {
        return ResponseEntity.ok(printerService.addPrinter(printer));
    }

    @GetMapping
    public ResponseEntity<List<Printer>> getAllPrinters() {
        return ResponseEntity.ok(printerService.getAllPrinters());
    }

    @GetMapping("/{printerId}/jobs")
    public ResponseEntity<List<PrintJob>> getPrinterJobs(@PathVariable Long printerId) {
        return ResponseEntity.ok(printerService.getPrinterJobs(printerId));
    }
}