package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.repository.PrintJobRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PrinterService {
    private final PrinterRepository printerRepository;
    private final PrintJobRepository printJobRepository;
    private static final Logger logger = LoggerFactory.getLogger(PrinterService.class);

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
     * Retrieve a printer by its ID.
     * @param id the printer ID
     * @return the printer if found, empty otherwise
     */
    public Optional<Printer> getPrinterById(Long id) {
        return printerRepository.findById(id);
    }

    /**
     * Update a printer's status.
     * @param id the printer ID
     * @param status the new status
     * @return the updated printer if successful, empty otherwise
     */
    public Optional<Printer> updatePrinterStatus(Long id, PrinterStatus status) {
        Optional<Printer> printerOpt = printerRepository.findById(id);
        if (printerOpt.isPresent()) {
            Printer printer = printerOpt.get();
            printer.setStatus(status);
            Printer savedPrinter = printerRepository.save(printer);
            logger.info("Updated printer {} status to: {}", id, status);
            return Optional.of(savedPrinter);
        }
        logger.warn("Attempted to update status for non-existent printer: {}", id);
        return Optional.empty();
    }

    /**
     * Update a printer's queue length.
     * @param id the printer ID
     * @param queueLength the new queue length
     * @return the updated printer if successful, empty otherwise
     */
    public Optional<Printer> updatePrinterQueueLength(Long id, int queueLength) {
        Optional<Printer> printerOpt = printerRepository.findById(id);
        if (printerOpt.isPresent()) {
            Printer printer = printerOpt.get();
            printer.setQueueLength(queueLength);
            Printer savedPrinter = printerRepository.save(printer);
            logger.info("Updated printer {} queue length to: {}", id, queueLength);
            return Optional.of(savedPrinter);
        }
        logger.warn("Attempted to update queue length for non-existent printer: {}", id);
        return Optional.empty();
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

    /**
     * Delete a printer by its ID.
     * @param id the printer ID
     * @return true if deleted successfully, false otherwise
     */
    public boolean deletePrinter(Long id) {
        if (printerRepository.existsById(id)) {
            printerRepository.deleteById(id);
            logger.info("Deleted printer with ID: {}", id);
            return true;
        }
        logger.warn("Attempted to delete non-existent printer: {}", id);
        return false;
    }

    /**
     * Find all printers that don't have an owner assigned.
     * @return list of printers without owners
     */
    public List<Printer> findPrintersWithoutOwners() {
        List<Printer> allPrinters = printerRepository.findAll();
        return allPrinters.stream()
                .filter(printer -> printer.getOwner() == null)
                .collect(Collectors.toList());
    }

    /**
     * Assign an owner to a printer.
     * @param printerId the printer ID
     * @param owner the user to assign as owner
     * @return the updated printer if successful, empty otherwise
     */
    public Optional<Printer> assignOwnerToPrinter(Long printerId, User owner) {
        Optional<Printer> printerOpt = printerRepository.findById(printerId);
        if (printerOpt.isPresent()) {
            Printer printer = printerOpt.get();
            printer.setOwner(owner);
            Printer savedPrinter = printerRepository.save(printer);
            logger.info("Assigned owner {} to printer {}", owner.getName(), printerId);
            return Optional.of(savedPrinter);
        }
        logger.warn("Attempted to assign owner to non-existent printer: {}", printerId);
        return Optional.empty();
    }

    /**
     * Get online printers with owners.
     * @return list of online printers that have owners
     */
    public List<Printer> getOnlinePrintersWithOwners() {
        List<Printer> allPrinters = printerRepository.findAll();
        return allPrinters.stream()
                .filter(printer -> printer.getStatus() == PrinterStatus.ONLINE && printer.getOwner() != null)
                .collect(Collectors.toList());
    }
}
