package com.example.smartprint.service;

import com.example.smartprint.dto.AddFundsRequest;
import com.example.smartprint.model.User;
import com.example.smartprint.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Autowired
    private UserRepository userRepository;

    // Predefined amounts for quick add funds
    public static final double[] QUICK_AMOUNTS = {50.0, 100.0, 150.0, 200.0};

    @Transactional
    public Map<String, Object> addFundsToBalance(String userEmail, AddFundsRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Find user by email
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate amount
            if (request.getAmount() <= 0) {
                response.put("success", false);
                response.put("message", "Amount must be greater than 0");
                return response;
            }

            // Check if amount is in predefined list
            boolean isValidAmount = false;
            for (double amount : QUICK_AMOUNTS) {
                if (amount == request.getAmount()) {
                    isValidAmount = true;
                    break;
                }
            }

            if (!isValidAmount) {
                response.put("success", false);
                response.put("message", "Invalid amount. Please select from: 50, 100, 150, or 200 Taka");
                return response;
            }

            // Simulate payment processing (dummy payment)
            boolean paymentSuccess = processDummyPayment(request.getAmount(), request.getPaymentMethod());
            
            if (paymentSuccess) {
                // Update user balance
                double newBalance = user.getBalance() + request.getAmount();
                user.setBalance(newBalance);
                
                // Update payment method if provided
                if (request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty()) {
                    user.setPaymentMethod(request.getPaymentMethod());
                }
                
                userRepository.save(user);
                
                response.put("success", true);
                response.put("message", "Funds added successfully!");
                response.put("newBalance", newBalance);
                response.put("amountAdded", request.getAmount());
                response.put("transactionId", generateTransactionId());
            } else {
                response.put("success", false);
                response.put("message", "Payment failed. Please try again.");
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error processing payment: " + e.getMessage());
        }
        
        return response;
    }

    private boolean processDummyPayment(double amount, String paymentMethod) {
        // Simulate payment processing with 95% success rate
        // In a real implementation, this would integrate with a payment gateway
        try {
            // Simulate network delay
            Thread.sleep(1000);
            
            // Simulate payment success (95% success rate)
            return Math.random() > 0.05;
        } catch (InterruptedException e) {
            return false;
        }
    }

    private String generateTransactionId() {
        // Generate a simple transaction ID
        return "TXN" + System.currentTimeMillis() + (int)(Math.random() * 1000);
    }

    public double[] getQuickAmounts() {
        return QUICK_AMOUNTS;
    }
} 