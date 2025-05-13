package com.example.smartprint.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "print_jobs")
public class PrintJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "printer_id", nullable = false)
    private Printer printer;

    @Column(nullable = false)
    private String documentName;

    @Column(nullable = false)
    private int pageCount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PrintType printType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PageSize pageSize;

    @Column
    @Enumerated(EnumType.STRING)
    private Orientation orientation;

    @Column(nullable = false)
    private double cost;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PrintJobStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime completedAt;

    @Column
    private String filePath;

    @ElementCollection
    @CollectionTable(name = "print_job_files", joinColumns = @JoinColumn(name = "print_job_id"))
    @Column(name = "file_path")
    private List<String> filePaths;

    @Column(nullable = false)
    private int totalPages;

    @Column(nullable = false)
    private double totalCost;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DeliveryOption deliveryOption;
} 