package com.campus.booking.service;

import com.campus.booking.dto.BookingPolicyDto;
import com.campus.booking.dto.DashboardMetricsResponse;
import com.campus.booking.dto.UserResponse;
import com.campus.booking.entity.*;
import com.campus.booking.exception.InvalidBookingStateException;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.*;
import com.campus.booking.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final BookingPolicyRepository policyRepository;
    private final BookingService bookingService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getAdminDashboardMetrics() {
        LocalDate today = LocalDate.now();

        long totalUsers = userRepository.count();
        long totalActiveResources = resourceRepository.countByIsActiveTrue();
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long approvedBookings = bookingRepository.countByStatus(BookingStatus.APPROVED);
        long rejectedBookings = bookingRepository.countByStatus(BookingStatus.REJECTED);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);
        long totalBookings = bookingRepository.count();

        List<Booking> todayBookings = bookingRepository.findTodayApprovedBookings(today);

        // Category distribution
        Map<String, Long> categoryDistribution = new HashMap<>();
        for (ResourceType type : ResourceType.values()) {
            categoryDistribution.put(type.name(), resourceRepository.countByType(type));
        }

        // Most booked resources
        List<Map<String, Object>> mostBooked = new ArrayList<>();
        List<Object[]> rawMostBooked = bookingRepository.findMostBookedResources();
        int limit = Math.min(5, rawMostBooked.size());
        for (int i = 0; i < limit; i++) {
            Object[] row = rawMostBooked.get(i);
            Map<String, Object> map = new HashMap<>();
            map.put("resourceId", row[0]);
            map.put("name", row[1]);
            map.put("type", row[2] != null ? row[2].toString() : "");
            map.put("bookingCount", row[3]);
            mostBooked.add(map);
        }

        // Recent 5 bookings
        List<Booking> recent = bookingRepository.findTop5ByOrderByCreatedAtDesc();

        return DashboardMetricsResponse.builder()
                .totalBookings(totalBookings)
                .pendingBookings(pendingBookings)
                .approvedBookings(approvedBookings)
                .rejectedBookings(rejectedBookings)
                .cancelledBookings(cancelledBookings)
                .totalActiveResources(totalActiveResources)
                .totalUsers(totalUsers)
                .todayBookingsCount(todayBookings.size())
                .categoryDistribution(categoryDistribution)
                .mostBookedResources(mostBooked)
                .recentBookings(recent.stream().map(bookingService::mapToResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getUserDashboardMetrics() {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        long total = bookingRepository.countByUserId(currentUserId);
        long pending = bookingRepository.countByUserIdAndStatus(currentUserId, BookingStatus.PENDING);
        long approved = bookingRepository.countByUserIdAndStatus(currentUserId, BookingStatus.APPROVED);
        long rejected = bookingRepository.countByUserIdAndStatus(currentUserId, BookingStatus.REJECTED);
        long cancelled = bookingRepository.countByUserIdAndStatus(currentUserId, BookingStatus.CANCELLED);

        List<Booking> recent = bookingRepository.findTop5ByUserIdOrderByCreatedAtDesc(currentUserId);

        return DashboardMetricsResponse.builder()
                .totalBookings(total)
                .pendingBookings(pending)
                .approvedBookings(approved)
                .rejectedBookings(rejected)
                .cancelledBookings(cancelled)
                .recentBookings(recent.stream().map(bookingService::mapToResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(u -> UserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .department(u.getDepartment())
                .phone(u.getPhone())
                .universityId(u.getUniversityId())
                .active(u.getActive())
                .createdAt(u.getCreatedAt())
                .build());
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, Role newRole) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new UnauthorizedOperationException("Cannot modify your own administrator role");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Role oldRole = user.getRole();
        user.setRole(newRole);
        User updated = userRepository.save(user);

        auditService.logAction("USER_ROLE_CHANGED", "USER", user.getId(), 
                "Role changed from " + oldRole + " to " + newRole);

        return UserResponse.builder()
                .id(updated.getId())
                .email(updated.getEmail())
                .fullName(updated.getFullName())
                .role(updated.getRole())
                .department(updated.getDepartment())
                .phone(updated.getPhone())
                .universityId(updated.getUniversityId())
                .active(updated.getActive())
                .createdAt(updated.getCreatedAt())
                .build();
    }

    @Transactional
    public UserResponse toggleUserStatus(Long userId, Boolean active) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new UnauthorizedOperationException("Cannot deactivate your own administrator account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setActive(active);
        User updated = userRepository.save(user);

        auditService.logAction("USER_STATUS_TOGGLED", "USER", user.getId(), 
                "Status changed to " + (active ? "ACTIVE" : "INACTIVE"));

        return UserResponse.builder()
                .id(updated.getId())
                .email(updated.getEmail())
                .fullName(updated.getFullName())
                .role(updated.getRole())
                .department(updated.getDepartment())
                .phone(updated.getPhone())
                .universityId(updated.getUniversityId())
                .active(updated.getActive())
                .createdAt(updated.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BookingPolicyDto> getAllPolicies() {
        return policyRepository.findAll().stream().map(this::mapPolicyToDto).toList();
    }

    @Transactional
    public BookingPolicyDto updatePolicy(Long policyId, String policyValue) {
        BookingPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with ID: " + policyId));

        policy.setPolicyValue(policyValue.trim());
        BookingPolicy updated = policyRepository.save(policy);

        auditService.logAction("POLICY_UPDATED", "POLICY", policy.getId(), 
                "Key: " + policy.getPolicyKey() + " set to " + policyValue);

        return mapPolicyToDto(updated);
    }

    private BookingPolicyDto mapPolicyToDto(BookingPolicy p) {
        return BookingPolicyDto.builder()
                .id(p.getId())
                .policyKey(p.getPolicyKey())
                .policyValue(p.getPolicyValue())
                .description(p.getDescription())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
