package com.example.smartprint.service;

import com.example.smartprint.model.*;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.UserRepository;
import com.example.smartprint.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    /**
     * Get a list of recent users for the admin dashboard
     * @return List of recent users
     */
    public List<User> getRecentUsers() {
        return userRepository.findAll().stream()
            .limit(5)  // Return just the most recent 5 users
            .toList();
    }
    
    /**
     * Get the total count of users in the system
     * @return Count of all users
     */
    public long getTotalUserCount() {
        return userRepository.count();
    }
    
    /**
     * Get all users in the system
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public long countUsers() {
        return userRepository.count();
    }
    
    public List<User> getRecentUsers(int limit) {
        return userRepository.findAll(PageRequest.of(0, limit)).getContent();
    }
    
    /**
     * Get a user by their ID
     * @param id The user ID
     * @return The user object or null if not found
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    /**
     * Update a user's password
     * @param user The user to update
     * @param newPassword The new password (will be encoded)
     */
    public void updatePassword(User user, String newPassword) {
        // In a real app, you would encode the password first
        // String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(newPassword); // For demo, we're not encoding
        userRepository.save(user);
    }
    
    /**
     * Save a user to the database
     * @param user The user to save
     * @return The saved user
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    /**
     * Delete a user by their ID
     * @param id The ID of the user to delete
     * @return true if deleted, false otherwise
     */
    public boolean deleteUser(Long id) {
        try {
            userRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}