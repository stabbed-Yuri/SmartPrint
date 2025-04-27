package com.example.smartprint.controller;

import com.example.smartprint.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    @Mock
    AuthService authService;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        // manually wire up the controller with the mock
        AuthController ctrl = new AuthController(authService);
        mvc = MockMvcBuilders.standaloneSetup(ctrl).build();
    }

    @Test
    void register_returnsJwt() throws Exception {
        given(authService.register(any())).willReturn("TOK");
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"password\":\"p\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("TOK"));
    }
}
