package com.example.smartprint.service;

import com.example.smartprint.model.User;
import com.example.smartprint.repository.UserRepository;
import com.example.smartprint.utils.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock private UserRepository userRepo;
    @Mock private PasswordEncoder encoder;
    @Mock private JwtUtils jwtUtils;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void register_encodesPassword_andGeneratesToken() {
        User u = new User();
        u.setEmail("foo@bar.com");
        u.setPassword("raw");

        when(encoder.encode("raw")).thenReturn("ENC");
        when(jwtUtils.generateToken("foo@bar.com")).thenReturn("TOK");

        String token = authService.register(u);

        verify(userRepo).save(u);
        assertEquals("ENC", u.getPassword());
        assertEquals("TOK", token);
    }

    @Test
    void login_throwsWhenUserNotFound() {
        when(userRepo.findByEmail("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.login("x","p"));
    }

    @Test
    void login_throwsWhenWrongPassword() {
        User u = new User();
        u.setPassword("ENC");
        when(userRepo.findByEmail("a")).thenReturn(Optional.of(u));
        when(encoder.matches("bad","ENC")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login("a","bad"));
    }

    @Test
    void login_returnsTokenOnSuccess() {
        User u = new User();
        u.setEmail("u@e");
        u.setPassword("ENC");
        when(userRepo.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(encoder.matches("raw","ENC")).thenReturn(true);
        when(jwtUtils.generateToken("u@e")).thenReturn("GOODTOK");

        String tok = authService.login("u@e","raw");
        assertEquals("GOODTOK", tok);
    }
}
