package com.example.smartprint.dto;

import com.example.smartprint.model.Printer;
import com.example.smartprint.model.PrinterStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PrinterDTO {
    private Long id;
    private String name;
    private String location;
    private PrinterStatus status;
    private String ipAddress;
    private int queueLength;
    private double blackAndWhiteRate;
    private double colorRate;
    private String ownerName;

    public static PrinterDTO fromEntity(Printer printer) {
        PrinterDTO dto = new PrinterDTO();
        dto.setId(printer.getId());
        dto.setName(printer.getName());
        dto.setLocation(printer.getLocation());
        dto.setStatus(printer.getStatus());
        dto.setIpAddress(printer.getIpAddress());
        dto.setQueueLength(printer.getQueueLength());
        dto.setBlackAndWhiteRate(printer.getBlackAndWhiteRate());
        dto.setColorRate(printer.getColorRate());
        if (printer.getOwner() != null) {
            dto.setOwnerName(printer.getOwner().getName());
        }
        return dto;
    }

    public Printer toEntity() {
        Printer printer = new Printer();
        printer.setId(this.id);
        printer.setName(this.name);
        printer.setLocation(this.location);
        printer.setStatus(this.status);
        printer.setIpAddress(this.ipAddress);
        printer.setBlackAndWhiteRate(this.blackAndWhiteRate);
        printer.setColorRate(this.colorRate);
        // Note: We don't map owner back from DTO to prevent circular dependencies
        // and to ensure owner is managed separately.
        return printer;
    }
} 