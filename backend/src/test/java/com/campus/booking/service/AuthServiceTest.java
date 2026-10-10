package com.campus.booking.service;

import com.campus.booking.dto.AuthRequest;
import com.campus.booking.dto.AuthResponse;
import com.campus.booking.dto.RegisterRequest;
import com.campus.booking.entity.Role;
import com.campus.booking.entity.User;
import com.campus.booking.exception.InvalidBookingStateException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.UserRepository;
import com.campus.booking.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("student@campus.edu")
                .passwordHash("hashed_secret")
                .fullName("John Doe")
                .role(Role.STUDENT)
                .department("Computer Science")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully register student account")
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newstudent@campus.edu")
                .password("Password@123")
                .fullName("Jane Smith")
                .department("Engineering")
                .role(Role.STUDENT)
                .build();

        when(userRepository.existsByEmail("newstudent@campus.edu")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateTokenFromUser(any(), any(), any(), any())).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        verify(userRepository).save(any(User.class));
        verify(auditService).logAction(eq("USER_REGISTERED"), eq("USER"), any(), any());
    }

    @Test
    @DisplayName("Should reject public registration attempting to self-assign ADMIN role")
    void testRegisterAdminForbidden() {
        RegisterRequest request = RegisterRequest.builder()
                .email("hacker@campus.edu")
                .password("Password@123")
                .fullName("Evil Admin")
                .role(Role.ADMIN)
                .department("IT")
                .build();

        UnauthorizedOperationException ex = assertThrows(UnauthorizedOperationException.class, () -> {
            authService.register(request);
        });

        assertTrue(ex.getMessage().contains("Cannot register as administrator"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@campus.edu")
                .password("Password@123")
                .fullName("John Doe")
                .department("Computer Science")
                .role(Role.STUDENT)
                .build();

        when(userRepository.existsByEmail("student@campus.edu")).thenReturn(true);

        assertThrows(InvalidBookingStateException.class, () -> {
            authService.register(request);
        });
    }

    @Test
    @DisplayName("Should successfully login and return JWT token")
    void testLoginSuccess() {
        AuthRequest request = AuthRequest.builder()
                .email("student@campus.edu")
                .password("Password@123")
                .build();

        Authentication mockAuth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(mockAuth);
        when(userRepository.findByEmail("student@campus.edu")).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateToken(mockAuth)).thenReturn("valid.jwt.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("valid.jwt.token", response.getToken());
        assertEquals("student@campus.edu", response.getEmail());
    }
}
