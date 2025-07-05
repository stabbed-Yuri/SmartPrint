package com.example.smartprint.dto;

import com.example.smartprint.model.PrintJob;
import java.util.List;
import java.util.stream.Collectors;

public class PrintJobDTO {
    public Long id;
    public String userName;
    public String printerName;
    public String documentName;
    public int pageCount;
    public String printType;
    public String pageSize;
    public String orientation;
    public double cost;
    public String status;
    public String createdAt;
    public String completedAt;
    public List<String> filePaths;
    public int totalPages;
    public double totalCost;
    public String deliveryOption;
    public int copyCount;

    public static PrintJobDTO fromEntity(PrintJob job) {
        PrintJobDTO dto = new PrintJobDTO();
        dto.id = job.getId();
        dto.userName = job.getUser() != null ? job.getUser().getName() : "Unknown User";
        dto.printerName = job.getPrinter() != null ? job.getPrinter().getName() : "Unknown Printer";
        dto.documentName = job.getDocumentName();
        dto.pageCount = job.getPageCount();
        dto.printType = job.getPrintType() != null ? job.getPrintType().name() : "N/A";
        dto.pageSize = job.getPageSize() != null ? job.getPageSize().name() : "N/A";
        dto.orientation = job.getOrientation() != null ? job.getOrientation().name() : "N/A";
        dto.cost = job.getCost();
        dto.status = job.getStatus() != null ? job.getStatus().name() : "UNKNOWN";
        dto.createdAt = job.getCreatedAt() != null ? job.getCreatedAt().toString() : "";
        dto.completedAt = job.getCompletedAt() != null ? job.getCompletedAt().toString() : "";
        dto.filePaths = job.getFilePaths();
        dto.totalPages = job.getTotalPages();
        dto.totalCost = job.getTotalCost();
        dto.deliveryOption = job.getDeliveryOption() != null ? job.getDeliveryOption().name() : "N/A";
        dto.copyCount = job.getCopyCount();
        return dto;
    }
} 