package com.example.smartprint.controller;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.service.PrintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/printers")
public class PrinterController {
    private final PrinterRepository printerRepository;
    private final PrintService printService;
    private final RestTemplate restTemplate;
    private static final Logger logger = LoggerFactory.getLogger(PrinterController.class);

    @Autowired
    public PrinterController(PrinterRepository printerRepository, 
                           PrintService printService,
                           RestTemplate restTemplate) {
        this.printerRepository = printerRepository;
        this.printService = printService;
        this.restTemplate = restTemplate;
    }

    @GetMapping
    public List<Printer> getAllPrinters() {
        return printerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPrinter(@PathVariable Long id) {
        Optional<Printer> printer = printerRepository.findById(id);
        if (printer.isPresent()) {
            return ResponseEntity.ok(printer.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePrinter(@PathVariable Long id) {
        if (printerRepository.existsById(id)) {
            printerRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<?> getPrinterStatus(@PathVariable Long id) {
        Optional<Printer> printerOpt = printerRepository.findById(id);
        
        if (!printerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Printer printer = printerOpt.get();
        
        try {
            // Call the Raspberry Pi API to get the status
            String piEndpoint = "http://" + printer.getIpAddress() + ":5000/status";
            ResponseEntity<Map> response = restTemplate.getForEntity(piEndpoint, Map.class);
            
            // Update the printer status in the database
            if (response.getBody() != null && response.getBody().containsKey("status")) {
                printer.setStatus(PrinterStatus.ONLINE);
                printerRepository.save(printer);
            }
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            // If the Pi is unreachable, mark the printer as offline
            printer.setStatus(PrinterStatus.OFFLINE);
            printerRepository.save(printer);
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not connect to printer: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }
    
    @PostMapping("/{id}/connect")
    public ResponseEntity<?> connectToPrinter(@PathVariable Long id) {
        Optional<Printer> printerOpt = printerRepository.findById(id);
        
        if (!printerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Printer printer = printerOpt.get();
        
        try {
            // Call the Raspberry Pi API to test the connection
            String piEndpoint = "http://" + printer.getIpAddress() + ":5000/status";
            restTemplate.getForEntity(piEndpoint, Map.class);
            
            // Update the printer status
            printer.setStatus(PrinterStatus.ONLINE);
            printerRepository.save(printer);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "connected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to connect to printer: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }

    @ResponseBody
    @PostMapping("/{id}/status")
    public ResponseEntity<?> updatePrinterStatus(@PathVariable Long id, @RequestBody Map<String, String> statusRequest) {
        try {
            // Get the printer
            Printer printer = printerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + id));
                
            // Update status
            String statusStr = statusRequest.get("status");
            PrinterStatus status;
            try {
                status = PrinterStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
            }
            
            printer.setStatus(status);
            printerRepository.save(printer);
            
            return ResponseEntity.ok(Map.of("message", "Printer status updated successfully"));
        } catch (Exception e) {
            logger.error("Error updating printer status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update printer status: " + e.getMessage()));
        }
    }
}