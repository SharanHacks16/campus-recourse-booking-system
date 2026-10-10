package com.campus.booking.dto;

import com.campus.booking.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private String department;
    private String phone;
    private String universityId;
    private Boolean active;
    private LocalDateTime createdAt;
}
