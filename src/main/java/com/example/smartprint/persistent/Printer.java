package com.example.smartprint.persistent;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity

public class Printer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String location;
    private double costPerPage;  // This enables getCostPerPage()
    private String ipAddress;
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
    @OneToMany(mappedBy = "printer")
    private List<PrintJob> jobs;
    public double getCostPerPage() {
        return this.costPerPage;
    }
    public String getIpAddress() {
        return this.ipAddress;
    }
}