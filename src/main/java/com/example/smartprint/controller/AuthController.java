package com.example.smartprint.controller;

import com.example.smartprint.model.User;
import com.example.smartprint.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@Controller
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // REST API endpoints
    @ResponseBody
    @PostMapping(value = "/register", consumes = "application/json")
    public ResponseEntity<String> registerApi(@RequestBody User user) {
        return ResponseEntity.ok(authService.register(user));
    }
    
    @ResponseBody
    @PostMapping(value = "/login", consumes = "application/json")
    public ResponseEntity<String> loginApi(@RequestParam String email,
                                      @RequestParam String password) {
        return ResponseEntity.ok(authService.login(email, password));
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