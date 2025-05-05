package com.example.smartprint.service;

import com.example.smartprint.model.User;
import com.example.smartprint.model.UserRole;
import com.example.smartprint.repository.UserRepository;
import com.example.smartprint.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public String register(User user) {
        try {
            // Check if user with this email already exists
            if (userRepository.existsByEmail(user.getEmail())) {
                logger.error("Registration failed: User with email {} already exists", user.getEmail());
                throw new RuntimeException("User with this email already exists");
            }
            
            // Set default values
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole(UserRole.USER);
            user.setBalance(0.0);
            
            logger.debug("Registering new user with email: {}", user.getEmail());
            User savedUser = userRepository.save(user);
            logger.info("User registered successfully: {}", savedUser.getEmail());
            
            return jwtUtils.generateToken(user.getEmail());
        } catch (Exception e) {
            logger.error("Error during registration for email {}: {}", 
                user.getEmail(), e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Register a user without generating a JWT token (for form-based registration)
     */
    public void registerUser(User user) {
        try {
            // Check if user with this email already exists
            if (userRepository.existsByEmail(user.getEmail())) {
                logger.error("Registration failed: User with email {} already exists", user.getEmail());
                throw new RuntimeException("User with this email already exists");
            }
            
            // Set default values
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole(UserRole.USER);
            user.setBalance(0.0);
            
            logger.debug("Registering new user with email: {}", user.getEmail());
            User savedUser = userRepository.save(user);
            logger.info("User registered successfully without token: {}", savedUser.getEmail());
        } catch (Exception e) {
            logger.error("Error during registration for email {}: {}", 
                user.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    public String login(String email, String password) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!passwordEncoder.matches(password, user.getPassword())) {
                logger.warn("Invalid password attempt for user: {}", email);
                throw new RuntimeException("Invalid password");
            }

            logger.info("User logged in successfully: {}", email);
            return jwtUtils.generateToken(email);
        } catch (Exception e) {
            logger.error("Login error: {}", e.getMessage());
            throw e;
        }
    }
}