package com.example.smartprint.service;

import com.example.smartprint.persistent.PrintJob;
import com.example.smartprint.persistent.User;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.UserRepository;
import com.example.smartprint.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class UserService {
    public UserService(UserRepository userRepository, PrintJobRepository printJobRepository, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.printJobRepository = printJobRepository;
        this.jwtUtils = jwtUtils;
    }

    private final UserRepository userRepository;
    private final PrintJobRepository printJobRepository;
    private final JwtUtils jwtUtils;

    public User getUserFromToken(String token) {
        String email = jwtUtils.extractUsername(token.replace("Bearer ", ""));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<PrintJob> getUserJobs(String token) {
        User user = getUserFromToken(token);
        return printJobRepository.findByUser(user);
    }
}