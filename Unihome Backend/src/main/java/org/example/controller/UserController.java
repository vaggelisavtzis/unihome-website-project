package org.example.controller;

import org.example.dto.user.UpdateOwnerProfileRequest;
import org.example.dto.user.UpdateStudentProfileRequest;
import org.example.dto.user.UpdateUserRequest;
import org.example.dto.user.UserProfileResponse;
import org.example.security.SecurityUtils;
import org.example.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return userService.getProfile(userId);
    }

    @PutMapping("/me")
    public UserProfileResponse updateUser(@Valid @RequestBody UpdateUserRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return userService.updateUser(userId, request);
    }

    @PutMapping("/me/student")
    @PreAuthorize("hasAnyRole('STUDENT','REGULAR')")
    public UserProfileResponse updateStudentProfile(@Valid @RequestBody UpdateStudentProfileRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return userService.updateStudentProfile(userId, request);
    }

    @PutMapping("/me/owner")
    @PreAuthorize("hasRole('OWNER')")
    public UserProfileResponse updateOwnerProfile(@Valid @RequestBody UpdateOwnerProfileRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return userService.updateOwnerProfile(userId, request);
    }
}
