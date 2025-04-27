package com.example.smartprint.repository;

import com.example.smartprint.persistent.PrintJob;
import com.example.smartprint.persistent.Printer;
import com.example.smartprint.persistent.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {
    // Change "findByUser" to "findByUser" (correct if field is named 'user')
    List<PrintJob> findByUser(User user);

    List<PrintJob> findByPrinter(Printer printer);
}