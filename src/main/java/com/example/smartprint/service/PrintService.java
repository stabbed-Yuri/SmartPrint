package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.PrinterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Service
public class PrintService {
    private final RestTemplate restTemplate;

    public PrintService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendToPrinter(PrintJob job) {
        Printer printer = job.getPrinter();  // Now works
        String piEndpoint = "http://" + printer.getIpAddress() + ":5000/print"; // Fixed case

        job.getFilePaths().forEach(filePath -> {  // Now works
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
}