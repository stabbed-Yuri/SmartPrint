package com.example.smartprint.controller;

import com.example.smartprint.persistent.PrintJob;
import com.example.smartprint.persistent.User;
import com.example.smartprint.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")

public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(userService.getUserFromToken(token));
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<List<PrintJob>> getUserJobs(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(userService.getUserJobs(token));
    }
}