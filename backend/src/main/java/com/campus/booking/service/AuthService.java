package com.campus.booking.service;

import com.campus.booking.dto.*;
import com.campus.booking.entity.Role;
import com.campus.booking.entity.User;
import com.campus.booking.exception.InvalidBookingStateException;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.UserRepository;
import com.campus.booking.security.JwtTokenProvider;
import com.campus.booking.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Enforce role security: Public registration can NEVER self-assign ADMIN
        if (request.getRole() == Role.ADMIN) {
            throw new UnauthorizedOperationException("Cannot register as administrator. Contact existing system admins.");
        }

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new InvalidBookingStateException("An account with email " + request.getEmail() + " already exists.");
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(request.getRole())
                .department(request.getDepartment().trim())
                .phone(request.getPhone())
                .universityId(request.getUniversityId())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUser(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getFullName()
        );

        auditService.logAction("USER_REGISTERED", "USER", savedUser.getId(), 
                "User registered with role " + savedUser.getRole());

        return mapToAuthResponse(savedUser, token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new UnauthorizedOperationException("This account has been deactivated. Please contact campus admin.");
        }

        String token = tokenProvider.generateToken(authentication);

        auditService.logAction("USER_LOGIN", "USER", user.getId(), "User logged in successfully");

        return mapToAuthResponse(user, token);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setFullName(request.getFullName().trim());
        user.setDepartment(request.getDepartment().trim());
        user.setPhone(request.getPhone());
        user.setUniversityId(request.getUniversityId());

        User updated = userRepository.save(user);
        auditService.logAction("USER_UPDATED_PROFILE", "USER", updated.getId(), "Profile details updated");

        return mapToUserResponse(updated);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidBookingStateException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.logAction("USER_CHANGED_PASSWORD", "USER", user.getId(), "Password updated successfully");
    }

    public AuthResponse mapToAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .universityId(user.getUniversityId())
                .build();
    }

    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .universityId(user.getUniversityId())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
