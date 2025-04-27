package com.example.smartprint.repository;

import com.example.smartprint.persistent.PrintJob;
import com.example.smartprint.persistent.Printer;
import com.example.smartprint.persistent.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}


