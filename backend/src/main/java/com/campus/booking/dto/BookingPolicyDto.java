package com.campus.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingPolicyDto {
    private Long id;

    @NotBlank(message = "Policy key is required")
    private String policyKey;

    @NotBlank(message = "Policy value is required")
    private String policyValue;

    private String description;
    private LocalDateTime updatedAt;
}
