package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.auth.AuthResponse;
import org.example.dto.auth.LoginRequest;
import org.example.dto.auth.RegisterOwnerRequest;
import org.example.dto.auth.RegisterStudentRequest;
import org.example.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/student")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerStudent(@Valid @RequestBody RegisterStudentRequest request) {
        return authService.registerStudent(request);
    }

    @PostMapping("/register/owner")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerOwner(@Valid @RequestBody RegisterOwnerRequest request) {
        return authService.registerOwner(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
