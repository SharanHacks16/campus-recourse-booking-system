package com.campus.booking.dto;

import com.campus.booking.entity.ResourceType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private Long id;
    private String name;
    private ResourceType type;
    private String building;
    private String roomNumber;
    private Integer capacity;
    private String description;
    private String department;
    private String amenities;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingOpenTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingCloseTime;

    private Boolean isActive;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
