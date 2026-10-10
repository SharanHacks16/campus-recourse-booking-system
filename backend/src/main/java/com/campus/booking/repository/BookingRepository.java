package com.campus.booking.repository;

import com.campus.booking.entity.Booking;
import com.campus.booking.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    // Overlap conflict detection query: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.bookingDate = :bookingDate " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses);

    // Overlap conflict detection query excluding a specific booking ID (used when approving or editing)
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.id <> :excludeBookingId " +
           "AND b.bookingDate = :bookingDate " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookingsExcludingId(
            @Param("resourceId") Long resourceId,
            @Param("excludeBookingId") Long excludeBookingId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses);

    // Availability calendar lookup
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.bookingDate = :bookingDate " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "ORDER BY b.startTime ASC")
    List<Booking> findActiveBookingsByResourceAndDate(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate);

    // Date range bookings for calendar
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.bookingDate BETWEEN :startDate AND :endDate " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "ORDER BY b.bookingDate ASC, b.startTime ASC")
    List<Booking> findActiveBookingsByResourceAndDateRange(
            @Param("resourceId") Long resourceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // User's own bookings
    Page<Booking> findByUserIdOrderByBookingDateDescStartTimeDesc(Long userId, Pageable pageable);

    List<Booking> findByUserIdOrderByBookingDateDescStartTimeDesc(Long userId);

    // Status counts for dashboards
    long countByStatus(BookingStatus status);

    long countByUserIdAndStatus(Long userId, BookingStatus status);

    long countByUserId(Long userId);

    // Today's reservations
    @Query("SELECT b FROM Booking b WHERE b.bookingDate = :today AND b.status = 'APPROVED' ORDER BY b.startTime ASC")
    List<Booking> findTodayApprovedBookings(@Param("today") LocalDate today);

    // Recent bookings
    List<Booking> findTop5ByOrderByCreatedAtDesc();

    List<Booking> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    // Frequent resources aggregation
    @Query("SELECT b.resource.id, b.resource.name, b.resource.type, COUNT(b.id) FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "GROUP BY b.resource.id, b.resource.name, b.resource.type " +
           "ORDER BY COUNT(b.id) DESC")
    List<Object[]> findMostBookedResources();
}
