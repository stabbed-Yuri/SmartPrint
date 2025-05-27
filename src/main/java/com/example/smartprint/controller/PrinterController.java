package com.example.smartprint.controller;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.service.PrintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
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

    @GetMapping("/status")
    public List<Map<String, Object>> getAllPrinterStatuses() {
        logger.info("GET /api/printers/status endpoint called");
        List<Printer> printers = printerRepository.findAll();
        logger.info("Found {} printers in database", printers.size());
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Printer printer : printers) {
            Map<String, Object> printerData = new HashMap<>();
            printerData.put("id", printer.getId());
            printerData.put("name", printer.getName());
            printerData.put("location", printer.getLocation());
            logger.info("Processing printer: {} (ID: {})", printer.getName(), printer.getId());
            
            try {
                // Set shorter timeout to avoid waiting too long for unresponsive printers
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
                
                // Create request with timeout settings
                org.springframework.web.client.RestTemplate timeoutTemplate = new org.springframework.web.client.RestTemplate();
                timeoutTemplate.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory());
                ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                    .setConnectTimeout(3000); // 3 seconds connection timeout
                ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                    .setReadTimeout(3000);    // 3 seconds read timeout
                
                // Call the Raspberry Pi API to get the status
                String piEndpoint = "http://" + printer.getIpAddress() + ":5000/status";
                ResponseEntity<Map> response = timeoutTemplate.exchange(
                    piEndpoint, 
                    org.springframework.http.HttpMethod.GET, 
                    entity, 
                    Map.class
                );
                
                if (response.getBody() != null && response.getBody().containsKey("status")) {
                    String statusString = (String) response.getBody().get("status");
                    PrinterStatus status;
                    
                    try {
                        status = PrinterStatus.valueOf(statusString);
                    } catch (IllegalArgumentException e) {
                        // Default to OFFLINE if the status string doesn't match any enum value
                        status = PrinterStatus.OFFLINE;
                        logger.warn("Invalid status value from printer {}: {}", printer.getId(), statusString);
                    }
                    
                    // Update printer in database
                    printer.setStatus(status);
                    
                    // Get queue length if available
                    if (response.getBody().containsKey("queueLength")) {
                        try {
                            int queueLength = Integer.parseInt(response.getBody().get("queueLength").toString());
                            printer.setQueueLength(queueLength);
                        } catch (NumberFormatException e) {
                            logger.warn("Invalid queue length format for printer {}: {}", 
                                       printer.getId(), response.getBody().get("queueLength"));
                        }
                    }
                    
                    printerRepository.save(printer);
                    
                    // Add enhanced response data
                    printerData.put("status", printer.getStatus().name());
                    printerData.put("queueLength", printer.getQueueLength());
                    printerData.put("message", response.getBody().containsKey("message") ? 
                                   response.getBody().get("message") : "No message");
                    printerData.put("inkLevels", response.getBody().containsKey("inkLevels") ? 
                                     response.getBody().get("inkLevels") : "Unknown");
                    printerData.put("timestamp", response.getBody().containsKey("timestamp") ? 
                                    response.getBody().get("timestamp") : null);
                } else {
                    // If no status key in response, mark as OFFLINE
                    printer.setStatus(PrinterStatus.OFFLINE);
                    printerRepository.save(printer);
                    
                    printerData.put("status", PrinterStatus.OFFLINE.name());
                    printerData.put("queueLength", printer.getQueueLength());
                    printerData.put("message", "Invalid response from printer");
                    logger.warn("Invalid response from printer {}: no status field", printer.getId());
                }
                
            } catch (Exception e) {
                // If the Pi is unreachable, mark as OFFLINE
                printer.setStatus(PrinterStatus.OFFLINE);
                printerRepository.save(printer);
                
                printerData.put("status", PrinterStatus.OFFLINE.name());
                printerData.put("queueLength", printer.getQueueLength());
                printerData.put("message", "Printer offline: " + e.getMessage());
                logger.warn("Error connecting to printer {}: {}", printer.getId(), e.getMessage());
            }
            
            result.add(printerData);
        }
        
        return result;
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<?> getPrinterStatus(@PathVariable Long id) {
        Optional<Printer> printerOpt = printerRepository.findById(id);
        
        if (!printerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Printer printer = printerOpt.get();
        
        try {
            // Set shorter timeout to avoid waiting too long for unresponsive printers
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            // Create request with timeout settings
            org.springframework.web.client.RestTemplate timeoutTemplate = new org.springframework.web.client.RestTemplate();
            timeoutTemplate.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory());
            ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                .setConnectTimeout(3000); // 3 seconds connection timeout
            ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                .setReadTimeout(3000);    // 3 seconds read timeout
                
            // Call the Raspberry Pi API to get the status
            String piEndpoint = "http://" + printer.getIpAddress() + ":5000/status";
            ResponseEntity<Map> response = timeoutTemplate.exchange(
                piEndpoint, 
                org.springframework.http.HttpMethod.GET, 
                entity, 
                Map.class
            );
            
            // Update the printer status in the database
            if (response.getBody() != null && response.getBody().containsKey("status")) {
                String statusString = (String) response.getBody().get("status");
                
                try {
                    PrinterStatus status = PrinterStatus.valueOf(statusString);
                    printer.setStatus(status);
                } catch (IllegalArgumentException e) {
                    printer.setStatus(PrinterStatus.ONLINE);
                }
                
                // Update queue length if available
                if (response.getBody().containsKey("queueLength")) {
                    try {
                        int queueLength = Integer.parseInt(response.getBody().get("queueLength").toString());
                        printer.setQueueLength(queueLength);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid queue length format: {}", response.getBody().get("queueLength"));
                    }
                }
                
                printerRepository.save(printer);
            }
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            // If the Pi is unreachable, mark the printer as offline
            printer.setStatus(PrinterStatus.OFFLINE);
            printerRepository.save(printer);
            
            Map<String, String> error = new HashMap<>();
            error.put("status", "OFFLINE");
            error.put("error", "Printer offline: " + e.getMessage());
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
            // Set shorter timeout to avoid waiting too long for unresponsive printers
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            // Create request with timeout settings
            org.springframework.web.client.RestTemplate timeoutTemplate = new org.springframework.web.client.RestTemplate();
            timeoutTemplate.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory());
            ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                .setConnectTimeout(3000); // 3 seconds connection timeout
            ((org.springframework.http.client.SimpleClientHttpRequestFactory) timeoutTemplate.getRequestFactory())
                .setReadTimeout(3000);    // 3 seconds read timeout
                
            // Call the Raspberry Pi API to test the connection
            String piEndpoint = "http://" + printer.getIpAddress() + ":5000/status";
            ResponseEntity<Map> response = timeoutTemplate.exchange(
                piEndpoint, 
                org.springframework.http.HttpMethod.GET, 
                entity, 
                Map.class
            );
            
            // Update the printer status
            printer.setStatus(PrinterStatus.ONLINE);
            printerRepository.save(printer);
            
            Map<String, String> responseData = new HashMap<>();
            responseData.put("status", "connected");
            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            // Mark the printer as offline
            printer.setStatus(PrinterStatus.OFFLINE);
            printerRepository.save(printer);
            
            Map<String, String> error = new HashMap<>();
            error.put("status", "OFFLINE");
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