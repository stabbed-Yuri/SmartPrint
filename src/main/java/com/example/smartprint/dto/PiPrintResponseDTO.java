package com.example.smartprint.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PiPrintResponseDTO {
    private String status;
    private String details;
    private String cupsJobId;
} 