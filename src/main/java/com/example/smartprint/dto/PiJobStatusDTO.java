package com.example.smartprint.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PiJobStatusDTO {
    private String jobId;
    private String status; // e.g., "COMPLETED", "PRINTING"
    private String message;
} 