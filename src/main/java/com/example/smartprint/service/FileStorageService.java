package com.example.smartprint.service;

import org.springframework.beans.factory.annotation.Value; // Correct import
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {
    @Value("${file.upload-dir}") // Spring's @Value annotation
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IOException("Only PDF files are allowed");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "document.pdf";
        }
        String fileName = UUID.randomUUID() + "_" + originalFilename;
        Path filePath = uploadPath.resolve(fileName);

        // Save file
        try {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Verify file was saved correctly
            if (!Files.exists(filePath) || Files.size(filePath) == 0) {
                throw new IOException("Failed to save file properly");
            }
            
            return filePath.toString();
        } catch (IOException e) {
            // Clean up if file was partially written
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
                // Ignore cleanup errors
            }
            throw new IOException("Failed to store file: " + e.getMessage(), e);
        }
    }
}