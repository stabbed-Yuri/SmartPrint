package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.repository.PrintJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class PrinterService {
    private final PrinterRepository printerRepository;
    private final PrintJobRepository printJobRepository;

    public PrinterService(PrinterRepository printerRepository, PrintJobRepository printJobRepository) {
        this.printerRepository = printerRepository;
        this.printJobRepository = printJobRepository;
    }

    /**
     * Add a new printer to the system.
     * @param printer the printer entity to save
     * @return the saved printer with generated ID
     */
    public Printer addPrinter(Printer printer) {
        return printerRepository.save(printer);
    }

    /**
     * Retrieve all printers registered in the system.
     * @return a list of all printers
     */
    public List<Printer> getAllPrinters() {
        return printerRepository.findAll();
    }

    /**
     * Retrieve all print jobs associated with a specific printer.
     * @param printerId the ID of the printer
     * @return a list of print jobs for the given printer
     * @throws RuntimeException if the printer does not exist
     */
    public List<PrintJob> getPrinterJobs(Long printerId) {
        Printer printer = printerRepository.findById(printerId)
                .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + printerId));
        return printJobRepository.findByPrinter(printer);
    }
}
