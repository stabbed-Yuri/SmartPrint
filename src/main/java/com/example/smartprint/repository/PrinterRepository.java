package com.example.smartprint.repository;

import com.example.smartprint.model.Printer;
import com.example.smartprint.model.PrinterStatus;
import com.example.smartprint.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrinterRepository extends JpaRepository<Printer, Long> {
    List<Printer> findByStatus(PrinterStatus status);
    List<Printer> findByLocation(String location);
    List<Printer> findByOwner(User owner);
}