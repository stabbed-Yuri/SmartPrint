package com.example.smartprint.controller;

import com.example.smartprint.model.User;
import com.example.smartprint.service.AuthService;
import com.example.smartprint.service.UserService;
import com.example.smartprint.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    private final UserService userService;
    
    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    // REST API endpoints
    @ResponseBody
    @PostMapping(value = "/register", consumes = "application/json")
    public ResponseEntity<Map<String, Object>> registerApi(@RequestBody User user) {
        try {
            String token = authService.register(user);
            User savedUser = userService.getUserByEmail(user.getEmail());
            
            if (savedUser == null) {
                logger.error("User not found after successful registration: {}", user.getEmail());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User data not found");
                return ResponseEntity.status(500).body(errorResponse);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", UserDTO.fromEntity(savedUser));
            
            logger.info("Registration successful for user: {}", user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Registration failed for user {}: {}", user.getEmail(), e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @ResponseBody
    @PostMapping(value = "/login", consumes = "application/json")
    public ResponseEntity<Map<String, Object>> loginApi(@RequestBody LoginRequest loginRequest) {
        try {
            String token = authService.login(loginRequest.email, loginRequest.password);
            User user = userService.getUserByEmail(loginRequest.email);
            
            if (user == null) {
                logger.error("User not found after successful login: {}", loginRequest.email);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User data not found");
                return ResponseEntity.status(500).body(errorResponse);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", UserDTO.fromEntity(user));
            
            logger.info("Login successful for user: {}", loginRequest.email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for user {}: {}", loginRequest.email, e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // MVC Form handling endpoints
    @PostMapping(value = "/register", consumes = "application/x-www-form-urlencoded")
    public RedirectView registerForm(User user, RedirectAttributes redirectAttributes) {
        try {
            logger.debug("Processing form registration for user: {}", user.getEmail());
            
            // Validate required fields
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                logger.warn("Registration failed: Email is required");
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Email is required");
                return new RedirectView("/signup");
            }
            
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                logger.warn("Registration failed: Password is required");
                redirectAttributes.addAttribute("error", "true"); 
                redirectAttributes.addAttribute("message", "Password is required");
                return new RedirectView("/signup");
            }
            
            if (user.getName() == null || user.getName().trim().isEmpty()) {
                logger.warn("Registration failed: Name is required");
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Name is required");
                return new RedirectView("/signup");
            }
            
            // Process registration without generating a JWT token
            authService.registerUser(user);
            logger.info("Form registration successful for: {}", user.getEmail());
            
            redirectAttributes.addAttribute("success", "true");
            return new RedirectView("/login");
        } catch (Exception e) {
            logger.error("Registration error: {}", e.getMessage(), e);
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            return new RedirectView("/signup");
        }
    }

    @PostMapping(value = "/login", consumes = "application/x-www-form-urlencoded")
    public RedirectView loginForm(@RequestParam String email,
                          @RequestParam String password,
                          RedirectAttributes redirectAttributes,
                          HttpServletResponse response) {
        try {
            logger.debug("Processing form login for user: {}", email);
            String token = authService.login(email, password);
            
            // Set the JWT token in a cookie
            Cookie jwtCookie = new Cookie("jwt", token);
            jwtCookie.setPath("/");
            jwtCookie.setHttpOnly(true);
            jwtCookie.setMaxAge(86400); // 1 day
            response.addCookie(jwtCookie);
            
            logger.info("Form login successful for: {}", email);
            return new RedirectView("/dashboard");
        } catch (Exception e) {
            logger.error("Login error: {}", e.getMessage());
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            return new RedirectView("/login");
        }
    }
    
    @PostMapping("/logout")
    public RedirectView logout(HttpServletResponse response) {
        // Clear the JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setPath("/");
        jwtCookie.setHttpOnly(true);
        jwtCookie.setMaxAge(0);
        response.addCookie(jwtCookie);
        
        logger.info("User logged out");
        return new RedirectView("/login?logout");
    }
}