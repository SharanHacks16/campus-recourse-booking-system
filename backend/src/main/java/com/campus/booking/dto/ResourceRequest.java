package com.campus.booking.dto;

import com.campus.booking.entity.ResourceType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequest {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotBlank(message = "Building is required")
    private String building;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String description;

    private String department;

    private String amenities;

    @NotNull(message = "Opening time is required")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingOpenTime;

    @NotNull(message = "Closing time is required")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingCloseTime;

    @Builder.Default
    private Boolean isActive = true;

    private String imageUrl;
}
