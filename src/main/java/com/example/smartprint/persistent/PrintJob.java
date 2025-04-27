package com.example.smartprint.persistent;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class PrintJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    private List<String> filePaths;

    public void setUser(User user) {
        this.user = user;
    }

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // Add this relationship
    @ManyToOne
    @JoinColumn(name = "printer_id")
    private Printer printer;

    @Enumerated(EnumType.STRING)
    private DeliveryOption deliveryOption;

    private String status;
    private int totalPages;
    private double totalCost;
    public void setFilePaths(List<String> filePaths) {
        this.filePaths = filePaths;
    }

    public void setPrinter(Printer printer) {
        this.printer = printer;
    }

    public void setDeliveryOption(DeliveryOption deliveryOption) {
        this.deliveryOption = deliveryOption;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public Printer getPrinter() {
        return this.printer;
    }

    public List<String> getFilePaths() {
        return this.filePaths;
    }
    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }
}