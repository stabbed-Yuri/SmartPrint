package com.example.smartprint.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
@Table(name = "printers")
public class Printer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PrinterStatus status;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "printer", cascade = CascadeType.ALL)
    private List<PrintJob> printJobs;

    @Column(nullable = false)
    private int queueLength;

    @Column(nullable = false)
    private double blackAndWhiteRate;

    @Column(nullable = false)
    private double colorRate;

    @Column(nullable = false)
    private String ipAddress;
} 