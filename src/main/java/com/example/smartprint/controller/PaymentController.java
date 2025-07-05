package com.example.smartprint.controller;

import com.example.smartprint.dto.AddFundsRequest;
import com.example.smartprint.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/add-funds")
    public ResponseEntity<?> addFunds(@RequestBody AddFundsRequest request) {
        try {
            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            String userEmail = authentication.getName();
            Map<String, Object> result = paymentService.addFundsToBalance(userEmail, request);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error processing payment: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/quick-amounts")
    public ResponseEntity<?> getQuickAmounts() {
        try {
            double[] amounts = paymentService.getQuickAmounts();
            Map<String, Object> response = new HashMap<>();
            response.put("amounts", amounts);
            response.put("currency", "BDT");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error fetching quick amounts: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
} 