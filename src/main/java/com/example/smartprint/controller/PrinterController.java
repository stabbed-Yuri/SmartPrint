package com.example.smartprint.controller;

import com.example.smartprint.dto.PrinterDTO;
import com.example.smartprint.model.Printer;
import com.example.smartprint.model.PrinterStatus;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.service.PrinterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/printers")
@RequiredArgsConstructor
public class PrinterController {

    private final PrinterRepository printerRepository;
    private final PrinterService printerService;

    @GetMapping
    public List<PrinterDTO> getAllPrinters() {
        return printerRepository.findAll().stream()
                .map(PrinterDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrinterDTO> getPrinterById(@PathVariable Long id) {
        return printerRepository.findById(id)
                .map(printer -> ResponseEntity.ok(PrinterDTO.fromEntity(printer)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PrinterDTO> createPrinter(@RequestBody PrinterDTO printerDTO) {
        Printer printer = printerDTO.toEntity();
        Printer savedPrinter = printerRepository.save(printer);
        return new ResponseEntity<>(PrinterDTO.fromEntity(savedPrinter), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrinterDTO> updatePrinter(@PathVariable Long id, @RequestBody PrinterDTO printerDTO) {
        return printerRepository.findById(id)
                .map(existingPrinter -> {
                    existingPrinter.setName(printerDTO.getName());
                    existingPrinter.setLocation(printerDTO.getLocation());
                    existingPrinter.setStatus(printerDTO.getStatus());
                    existingPrinter.setIpAddress(printerDTO.getIpAddress());
                    existingPrinter.setBlackAndWhiteRate(printerDTO.getBlackAndWhiteRate());
                    existingPrinter.setColorRate(printerDTO.getColorRate());
                    Printer updatedPrinter = printerRepository.save(existingPrinter);
                    return ResponseEntity.ok(PrinterDTO.fromEntity(updatedPrinter));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrinter(@PathVariable Long id) {
        if (!printerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        printerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updatePrinterStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> statusUpdate) {
        
        String statusString = statusUpdate.get("status");
        if (statusString == null || statusString.isEmpty()) {
            return createErrorResponse("Status field is required.", HttpStatus.BAD_REQUEST);
        }

        PrinterStatus newStatus;
        try {
            // Convert the incoming string to the PrinterStatus enum
            newStatus = PrinterStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return createErrorResponse("Invalid status value: '" + statusString + "'.", HttpStatus.BAD_REQUEST);
        }

        Optional<Printer> updatedPrinter = printerService.updatePrinterStatus(id, newStatus);
        
        if (updatedPrinter.isPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Printer status updated successfully to " + newStatus);
            response.put("status", newStatus.toString());
            return ResponseEntity.ok(response);
        } else {
            return createErrorResponse("Printer not found with id " + id, HttpStatus.NOT_FOUND);
        }
    }

    private ResponseEntity<Map<String, String>> createErrorResponse(String message, HttpStatus status) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        return new ResponseEntity<>(errorResponse, status);
    }
}