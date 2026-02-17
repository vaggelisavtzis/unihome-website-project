package org.example.service;

import org.example.dto.user.UpdateOwnerProfileRequest;
import org.example.dto.user.UpdateStudentProfileRequest;
import org.example.dto.user.UpdateUserRequest;
import org.example.dto.user.UserProfileResponse;
import org.example.dto.user.UserSummary;
import org.example.exception.ResourceNotFoundException;
import org.example.exception.ValidationException;
import org.example.mapper.UserMapper;
import org.example.model.user.UserEntity;
import org.example.repository.UserRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        UserEntity user = findUser(userId);
        return userMapper.toProfile(user);
    }

    @Transactional(readOnly = true)
    public UserSummary getSummary(UUID userId) {
        UserEntity user = findUser(userId);
        return userMapper.toSummary(user);
    }

    @Transactional
    public UserProfileResponse updateUser(UUID userId, UpdateUserRequest request) {
        if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
            throw new ValidationException("Email already in use", Map.of("email", "Το email χρησιμοποιείται ήδη."));
        }
        UserEntity user = findUser(userId);
        userMapper.apply(request, user);
        return userMapper.toProfile(user);
    }

    @Transactional
    public UserProfileResponse updateStudentProfile(UUID userId, UpdateStudentProfileRequest request) {
        UserEntity user = findUser(userId);
        userMapper.apply(request, user);
        return userMapper.toProfile(user);
    }

    @Transactional
    public UserProfileResponse updateOwnerProfile(UUID userId, UpdateOwnerProfileRequest request) {
        UserEntity user = findUser(userId);
        userMapper.apply(request, user);
        return userMapper.toProfile(user);
    }

    @Transactional(readOnly = true)
    public UserEntity findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
