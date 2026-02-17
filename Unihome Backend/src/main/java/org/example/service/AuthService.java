package org.example.service;

import org.example.dto.auth.AuthResponse;
import org.example.dto.auth.LoginRequest;
import org.example.dto.auth.RegisterOwnerRequest;
import org.example.dto.auth.RegisterStudentRequest;
import org.example.dto.user.UserSummary;
import org.example.exception.UnauthorizedException;
import org.example.exception.ValidationException;
import org.example.mapper.UserMapper;
import org.example.model.user.OwnerProfileEmbeddable;
import org.example.model.user.StudentProfileEmbeddable;
import org.example.model.user.UserEntity;
import org.example.model.user.UserRole;
import org.example.repository.UserRepository;
import org.example.security.JwtTokenProvider;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    public AuthService(
        AuthenticationManager authenticationManager,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        UserMapper userMapper
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }

    @Transactional
    public AuthResponse registerStudent(RegisterStudentRequest request) {
        validateEmailAvailability(request.getEmail());
        UserEntity entity = new UserEntity();
        entity.setEmail(request.getEmail().toLowerCase());
        entity.setPassword(passwordEncoder.encode(request.getPassword()));
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setPhone(request.getPhone());
        entity.setAge(request.getAge());
        boolean student = Optional.ofNullable(request.getStudent()).orElse(true);
        entity.setRole(student ? UserRole.STUDENT : UserRole.REGULAR);

        StudentProfileEmbeddable profile = new StudentProfileEmbeddable();
        profile.setUniversity(student ? request.getUniversity() : null);
        profile.setDepartment(student ? request.getDepartment() : null);
        profile.setSemester(request.getSemester());
        profile.setStudent(student);
        entity.setStudentProfile(profile);

        UserEntity saved = userRepository.save(entity);
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse registerOwner(RegisterOwnerRequest request) {
        validateEmailAvailability(request.getEmail());
        UserEntity entity = new UserEntity();
        entity.setEmail(request.getEmail().toLowerCase());
        entity.setPassword(passwordEncoder.encode(request.getPassword()));
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setPhone(request.getPhone());
        entity.setAge(request.getAge());
        entity.setRole(UserRole.OWNER);

        OwnerProfileEmbeddable profile = new OwnerProfileEmbeddable();
        profile.setAddress(request.getAddress());
        profile.setVatNumber(request.getVatNumber());
        entity.setOwnerProfile(profile);

        UserEntity saved = userRepository.save(entity);
        return buildAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid email or password");
        }

        UserEntity user = userRepository.findByEmail(request.getEmail().toLowerCase())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        return buildAuthResponse(user);
    }

    private void validateEmailAvailability(String email) {
        if (userRepository.existsByEmail(email.toLowerCase())) {
            Map<String, String> errors = new HashMap<>();
            errors.put("email", "Email is already registered");
            throw new ValidationException("Email already in use", errors);
        }
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("email", user.getEmail());
        String token = jwtTokenProvider.createToken(user.getId().toString(), claims);
        UserSummary summary = userMapper.toSummary(user);
        return new AuthResponse(token, jwtTokenProvider.getAccessTokenTtlSeconds(), summary);
    }
}
