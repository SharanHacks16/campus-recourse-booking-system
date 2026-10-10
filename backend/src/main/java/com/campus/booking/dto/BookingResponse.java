package com.campus.booking.dto;

import com.campus.booking.entity.BookingStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private String resourceType;
    private String building;
    private String roomNumber;
    private Integer resourceCapacity;

    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userRole;
    private String userDepartment;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String title;
    private String purpose;
    private Integer attendeesCount;
    private BookingStatus status;

    private String rejectionReason;
    private String cancellationReason;
    private Long cancelledById;
    private String cancelledByName;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime decisionTimestamp;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
