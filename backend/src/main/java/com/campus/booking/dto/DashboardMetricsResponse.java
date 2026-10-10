package com.campus.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsResponse {
    // General metrics
    private long totalBookings;
    private long pendingBookings;
    private long approvedBookings;
    private long rejectedBookings;
    private long cancelledBookings;

    // Admin metrics
    private long totalActiveResources;
    private long totalUsers;
    private long todayBookingsCount;

    // Trend & chart data
    private Map<String, Long> categoryDistribution;
    private List<Map<String, Object>> mostBookedResources;
    private List<Map<String, Object>> bookingTrends;
    private List<BookingResponse> recentBookings;
    private List<BookingResponse> upcomingBookings;
}
