package com.example.smartprint.repository;

import com.example.smartprint.model.PrintJob;
import com.example.smartprint.model.PrintJobStatus;
import com.example.smartprint.model.User;
import com.example.smartprint.model.Printer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {
    // Change "findByUser" to "findByUser" (correct if field is named 'user')
    List<PrintJob> findByUser(User user);

    List<PrintJob> findByPrinter(Printer printer);

    List<PrintJob> findByStatus(PrintJobStatus status);
    
    /**
     * Find the most recent print jobs
     * @return List of recent print jobs
     */
    @Query(value = "SELECT * FROM print_jobs ORDER BY created_at DESC LIMIT 5", nativeQuery = true)
    List<PrintJob> findRecentJobs();
    
    /**
     * Count print jobs created today
     * @return Number of jobs created today
     */
    @Query(value = "SELECT COUNT(*) FROM print_jobs WHERE DATE(created_at) = CURRENT_DATE", nativeQuery = true)
    int countTodaysJobs();
    
    /**
     * Count print jobs by status
     * @param status The print job status to count
     * @return Number of jobs with the given status
     */
    long countByStatus(PrintJobStatus status);
}