package com.example.smartprint.controller;

import com.example.smartprint.model.*;
import com.example.smartprint.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import com.example.smartprint.dto.UserDTO;
import com.example.smartprint.model.PrintJob;
import com.example.smartprint.model.User;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @ResponseBody
    @GetMapping("/me")
    public ResponseEntity<com.example.smartprint.dto.UserDTO> getCurrentUser(@RequestHeader("Authorization") String token) {
        logger.info("getCurrentUser called with token: {}", token != null ? "present" : "null");
        try {
            User user = userService.getUserFromToken(token);
            logger.info("User found: {}", user.getEmail());
            return ResponseEntity.ok(com.example.smartprint.dto.UserDTO.fromEntity(user));
        } catch (Exception e) {
            logger.error("Error getting current user: {}", e.getMessage(), e);
            throw e;
        }
    }

    @ResponseBody
    @GetMapping("/my-jobs")
    public ResponseEntity<java.util.List<com.example.smartprint.dto.PrintJobDTO>> getUserJobs(@RequestHeader("Authorization") String token) {
        logger.info("getUserJobs called with token: {}", token != null ? "present" : "null");
        try {
            List<PrintJob> jobs = userService.getUserJobs(token);
            logger.info("Found {} jobs for user", jobs.size());
            return ResponseEntity.ok(jobs.stream()
                .map(com.example.smartprint.dto.PrintJobDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            logger.error("Error getting user jobs: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.example.smartprint.dto.UserDTO>> getAllUsers() {
        logger.info("Admin request to get all users");
        try {
            List<User> users = userService.getAllUsers();
            List<com.example.smartprint.dto.UserDTO> userDTOs = users.stream()
                    .map(com.example.smartprint.dto.UserDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            logger.error("Error getting all users: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        logger.info("Admin request to create user: {}", userDTO.getEmail());
        try {
            User user = userDTO.toEntity();
            User createdUser = userService.saveUser(user);
            return ResponseEntity.ok(UserDTO.fromEntity(createdUser));
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        logger.info("Admin request to update user: {}", id);
        try {
            User existingUser = userService.getUserById(id);
            if (existingUser == null) {
                return ResponseEntity.notFound().build();
            }
            // Update fields from DTO
            existingUser.setName(userDTO.getName());
            existingUser.setEmail(userDTO.getEmail());
            existingUser.setRole(userDTO.getRole());
            existingUser.setBalance(userDTO.getBalance());
            existingUser.setActive(userDTO.isActive());

            User updatedUser = userService.saveUser(existingUser);
            return ResponseEntity.ok(UserDTO.fromEntity(updatedUser));
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        logger.info("Admin request to delete user: {}", id);
        try {
            boolean deleted = userService.deleteUser(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}