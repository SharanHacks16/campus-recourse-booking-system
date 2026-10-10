package com.campus.booking.controller;

import com.campus.booking.dto.AuditLogResponse;
import com.campus.booking.dto.BookingPolicyDto;
import com.campus.booking.dto.DashboardMetricsResponse;
import com.campus.booking.dto.UserResponse;
import com.campus.booking.entity.Role;
import com.campus.booking.service.AdminService;
import com.campus.booking.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Admin dashboard metrics, user accounts, audit trail, and policy configuration")
public class AdminController {

    private final AdminService adminService;
    private final AuditService auditService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard analytics and resource metrics")
    public ResponseEntity<DashboardMetricsResponse> getAdminDashboard() {
        return ResponseEntity.ok(adminService.getAdminDashboardMetrics());
    }

    @GetMapping("/user-metrics")
    @Operation(summary = "Get user personalized metrics for student/faculty dashboard")
    public ResponseEntity<DashboardMetricsResponse> getUserMetrics() {
        return ResponseEntity.ok(adminService.getUserDashboardMetrics());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all user accounts with pagination")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user role (Admin only)")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestParam Role role) {
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate or deactivate user account")
    public ResponseEntity<UserResponse> toggleUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean active) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id, active));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "View audit trail log history")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditLogs(pageable));
    }

    @GetMapping("/booking-policies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get configurable booking policies")
    public ResponseEntity<List<BookingPolicyDto>> getPolicies() {
        return ResponseEntity.ok(adminService.getAllPolicies());
    }

    @PutMapping("/booking-policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update booking policy value")
    public ResponseEntity<BookingPolicyDto> updatePolicy(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String value = body.get("policyValue");
        return ResponseEntity.ok(adminService.updatePolicy(id, value));
    }
}
