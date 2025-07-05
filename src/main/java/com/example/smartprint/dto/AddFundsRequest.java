package com.example.smartprint.dto;

public class AddFundsRequest {
    private double amount;
    private String paymentMethod;

    public AddFundsRequest() {}

    public AddFundsRequest(double amount, String paymentMethod) {
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
} 