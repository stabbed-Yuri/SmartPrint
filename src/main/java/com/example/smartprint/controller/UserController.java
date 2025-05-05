package com.example.smartprint.controller;

import com.example.smartprint.model.*;
import com.example.smartprint.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @ResponseBody
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(userService.getUserFromToken(token));
    }

    @ResponseBody
    @GetMapping("/my-jobs")
    public ResponseEntity<List<PrintJob>> getUserJobs(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(userService.getUserJobs(token));
    }
}