package com.example.smartprint.controller;

import com.example.smartprint.model.Printer;
import com.example.smartprint.repository.PrinterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/printer-status")
public class PrinterStatusController {

    private static final Logger logger = LoggerFactory.getLogger(PrinterStatusController.class);
    
    private final PrinterRepository printerRepository;
    
    @Autowired
    public PrinterStatusController(PrinterRepository printerRepository) {
        this.printerRepository = printerRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAllPrinterStatuses() {
        logger.info("GET /api/printer-status endpoint called");
        
        List<Map<String, Object>> result = new ArrayList<>();
        List<Printer> printers = printerRepository.findAll();
        
        for (Printer printer : printers) {
            Map<String, Object> printerData = new HashMap<>();
            printerData.put("id", printer.getId());
            printerData.put("name", printer.getName());
            printerData.put("status", printer.getStatus().name());
            printerData.put("location", printer.getLocation());
            printerData.put("queueLength", printer.getQueueLength());
            printerData.put("ipAddress", printer.getIpAddress());
            printerData.put("message", "Printer is " + printer.getStatus().name().toLowerCase());
            result.add(printerData);
        }
        
        logger.info("Returning status data for {} printers", result.size());
        return result;
    }
} 