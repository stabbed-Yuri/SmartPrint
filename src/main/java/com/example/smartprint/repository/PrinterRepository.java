package com.example.smartprint.repository;

import com.example.smartprint.persistent.Printer;
import com.example.smartprint.persistent.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrinterRepository extends JpaRepository<Printer, Long> {
    List<Printer> findByOwner(User owner);
}