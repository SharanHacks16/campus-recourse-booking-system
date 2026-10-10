package com.campus.booking.service;

import com.campus.booking.dto.BookingRequest;
import com.campus.booking.dto.BookingResponse;
import com.campus.booking.dto.CancelBookingRequest;
import com.campus.booking.dto.RejectBookingRequest;
import com.campus.booking.entity.*;
import com.campus.booking.exception.BookingConflictException;
import com.campus.booking.exception.InvalidBookingStateException;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.*;
import com.campus.booking.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final BookingPolicyRepository policyRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    /**
     * Concurrency-safe Booking Creation:
     * 1. Uses Isolation.READ_COMMITTED transaction boundary.
     * 2. Acquires Pessimistic Write Lock on target Resource (SELECT ... FOR UPDATE).
     * 3. Validates university policies, capacities, operating hours, and past times.
     * 4. Enforces overlap conflict rule: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
     * 5. Persists booking, audit log, and status history within the atomic transaction.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse createBooking(BookingRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // 1. Pessimistic Lock on Resource
        Resource resource = resourceRepository.findByIdWithLock(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + request.getResourceId()));

        // 2. Resource Active Validation
        if (!Boolean.TRUE.equals(resource.getIsActive())) {
            throw new InvalidBookingStateException("Cannot reserve inactive resource '" + resource.getName() + "'.");
        }

        // 3. Time Order Validation
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new InvalidBookingStateException("Start time (" + request.getStartTime() + ") must precede end time (" + request.getEndTime() + ").");
        }

        // 4. Past Time Slot Validation
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (request.getBookingDate().isBefore(today) ||
                (request.getBookingDate().isEqual(today) && request.getStartTime().isBefore(now))) {
            throw new InvalidBookingStateException("Cannot reserve past time slots. Current time: " + today + " " + now.withNano(0));
        }

        // 5. University Advance Booking Policy Validation
        int maxAdvanceDays = getPolicyInt("MAX_ADVANCE_DAYS", 30);
        if (request.getBookingDate().isAfter(today.plusDays(maxAdvanceDays))) {
            throw new InvalidBookingStateException("Bookings can only be reserved up to " + maxAdvanceDays + " days in advance.");
        }

        // 6. Capacity Validation
        if (request.getAttendeesCount() <= 0) {
            throw new InvalidBookingStateException("Expected attendees count must be positive.");
        }
        if (request.getAttendeesCount() > resource.getCapacity()) {
            throw new InvalidBookingStateException("Expected attendees (" + request.getAttendeesCount() + 
                    ") exceeds maximum facility capacity (" + resource.getCapacity() + ") for " + resource.getName());
        }

        // 7. Operating Hours Validation
        if (request.getStartTime().isBefore(resource.getOperatingOpenTime()) || 
            request.getEndTime().isAfter(resource.getOperatingCloseTime())) {
            throw new InvalidBookingStateException("Requested time slot (" + request.getStartTime() + " - " + request.getEndTime() + 
                    ") is outside facility operating hours (" + resource.getOperatingOpenTime() + " - " + resource.getOperatingCloseTime() + ")");
        }

        // 8. Server-Side Overlap Conflict Detection
        // Conflict formula: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                resource.getId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                Set.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );

        if (!conflicts.isEmpty()) {
            Booking conflict = conflicts.get(0);
            throw new BookingConflictException("Conflicting reservation exists for " + resource.getName() + 
                    " on " + request.getBookingDate() + " from " + conflict.getStartTime() + " to " + conflict.getEndTime() + 
                    " (" + conflict.getStatus() + "). Please select another time slot or facility.");
        }

        // Auto-approve if policy enabled or if created directly by Admin
        boolean autoApprove = currentUser.getRole() == Role.ADMIN ||
                (currentUser.getRole() == Role.FACULTY && getPolicyBool("AUTO_APPROVE_FACULTY", false));
        BookingStatus initialStatus = autoApprove ? BookingStatus.APPROVED : BookingStatus.PENDING;

        Booking booking = Booking.builder()
                .resource(resource)
                .user(currentUser)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .title(request.getTitle().trim())
                .purpose(request.getPurpose().trim())
                .attendeesCount(request.getAttendeesCount())
                .status(initialStatus)
                .decisionTimestamp(autoApprove ? LocalDateTime.now() : null)
                .approvedBy(autoApprove ? currentUser : null)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Record Status History
        createStatusHistory(savedBooking, null, initialStatus, currentUser, "Initial booking submission");

        // Send Notification
        String notifMsg = "Your booking request for " + resource.getName() + " on " + request.getBookingDate() + 
                " (" + request.getStartTime() + " - " + request.getEndTime() + ") has been submitted with status: " + initialStatus;
        notificationService.createNotification(
                currentUser,
                savedBooking,
                autoApprove ? "Booking Confirmed & Approved" : "Booking Request Submitted",
                notifMsg,
                autoApprove ? NotificationType.BOOKING_APPROVED : NotificationType.BOOKING_SUBMITTED
        );

        auditService.logAction("BOOKING_CREATED", "BOOKING", savedBooking.getId(), 
                "Resource: " + resource.getName() + ", Date: " + request.getBookingDate() + ", Status: " + initialStatus);

        return mapToResponse(savedBooking);
    }

    /**
     * Admin Approval Workflow with Concurrency Revalidation
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse approveBooking(Long bookingId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User admin = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStateException("Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        // Pessimistic lock on resource during approval to revalidate concurrency
        Resource resource = resourceRepository.findByIdWithLock(booking.getResource().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!Boolean.TRUE.equals(resource.getIsActive())) {
            throw new InvalidBookingStateException("Cannot approve booking for inactive facility: " + resource.getName());
        }

        // Recheck conflict against other APPROVED bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcludingId(
                resource.getId(),
                booking.getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                Set.of(BookingStatus.APPROVED)
        );

        if (!conflicts.isEmpty()) {
            Booking conflict = conflicts.get(0);
            throw new BookingConflictException("Cannot approve: Conflicting approved reservation exists from " + 
                    conflict.getStartTime() + " to " + conflict.getEndTime());
        }

        BookingStatus prev = booking.getStatus();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovedBy(admin);
        booking.setDecisionTimestamp(LocalDateTime.now());
        booking.setRejectionReason(null);

        Booking updated = bookingRepository.save(booking);

        createStatusHistory(updated, prev, BookingStatus.APPROVED, admin, "Approved by Administrator");

        // Send approval notification to requester
        notificationService.createNotification(
                booking.getUser(),
                updated,
                "Booking Request Approved",
                "Your reservation for " + resource.getName() + " on " + booking.getBookingDate() + 
                " (" + booking.getStartTime() + " - " + booking.getEndTime() + ") has been APPROVED.",
                NotificationType.BOOKING_APPROVED
        );

        auditService.logAction("BOOKING_APPROVED", "BOOKING", updated.getId(), 
                "Approved by admin: " + admin.getEmail());

        return mapToResponse(updated);
    }

    /**
     * Admin Rejection Workflow
     */
    @Transactional
    public BookingResponse rejectBooking(Long bookingId, RejectBookingRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User admin = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStateException("Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        BookingStatus prev = booking.getStatus();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(request.getReason().trim());
        booking.setDecisionTimestamp(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);

        createStatusHistory(updated, prev, BookingStatus.REJECTED, admin, "Rejected: " + request.getReason().trim());

        // Notify requester with reason
        notificationService.createNotification(
                booking.getUser(),
                updated,
                "Booking Request Rejected",
                "Your request for " + booking.getResource().getName() + " on " + booking.getBookingDate() + 
                " was REJECTED. Reason: " + request.getReason().trim(),
                NotificationType.BOOKING_REJECTED
        );

        auditService.logAction("BOOKING_REJECTED", "BOOKING", updated.getId(), 
                "Reason: " + request.getReason().trim());

        return mapToResponse(updated);
    }

    /**
     * Cancellation Workflow (User or Admin)
     */
    @Transactional
    public BookingResponse cancelBooking(Long bookingId, CancelBookingRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = booking.getUser().getId().equals(currentUserId);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedOperationException("You do not have permission to cancel another user's reservation.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
            throw new InvalidBookingStateException("Booking is already in terminal state: " + booking.getStatus());
        }

        // If user is cancelling an APPROVED booking, check cancellation window policy
        if (!isAdmin && booking.getStatus() == BookingStatus.APPROVED) {
            int minHoursNotice = getPolicyInt("CANCELLATION_MIN_HOURS", 2);
            LocalDateTime bookingStart = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
            if (LocalDateTime.now().plusHours(minHoursNotice).isAfter(bookingStart)) {
                throw new InvalidBookingStateException("Bookings can only be cancelled at least " + minHoursNotice + 
                        " hours before scheduled start time. Please contact facility administration.");
            }
        }

        BookingStatus prev = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledBy(currentUser);
        booking.setCancellationReason(request != null && StringUtils.hasText(request.getReason()) 
                ? request.getReason().trim() 
                : (isAdmin ? "Cancelled by Administrator" : "Cancelled by User"));

        Booking updated = bookingRepository.save(booking);

        createStatusHistory(updated, prev, BookingStatus.CANCELLED, currentUser, booking.getCancellationReason());

        // Notify user if admin cancelled it
        if (isAdmin && !isOwner) {
            notificationService.createNotification(
                    booking.getUser(),
                    updated,
                    "Booking Reservation Cancelled by Admin",
                    "Your reservation for " + booking.getResource().getName() + " on " + booking.getBookingDate() + 
                    " was CANCELLED. Reason: " + booking.getCancellationReason(),
                    NotificationType.BOOKING_CANCELLED
            );
        } else {
            notificationService.createNotification(
                    booking.getUser(),
                    updated,
                    "Booking Reservation Cancelled",
                    "Your booking for " + booking.getResource().getName() + " on " + booking.getBookingDate() + " has been CANCELLED.",
                    NotificationType.BOOKING_CANCELLED
            );
        }

        auditService.logAction("BOOKING_CANCELLED", "BOOKING", updated.getId(), 
                "Cancelled by " + currentUser.getEmail() + ". Reason: " + booking.getCancellationReason());

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return bookingRepository.findByUserIdOrderByBookingDateDescStartTimeDesc(currentUserId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() != Role.ADMIN && !booking.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedOperationException("Cannot view bookings belonging to other users.");
        }

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> searchAllBookings(
            Long resourceId,
            String department,
            BookingStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable) {

        Specification<Booking> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (resourceId != null) {
                predicates.add(cb.equal(root.get("resource").get("id"), resourceId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(department)) {
                predicates.add(cb.equal(cb.lower(root.get("user").get("department")), department.trim().toLowerCase()));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bookingDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("bookingDate"), endDate));
            }
            if (StringUtils.hasText(search)) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate userNameMatch = cb.like(cb.lower(root.get("user").get("fullName")), term);
                Predicate userEmailMatch = cb.like(cb.lower(root.get("user").get("email")), term);
                Predicate resNameMatch = cb.like(cb.lower(root.get("resource").get("name")), term);
                predicates.add(cb.or(titleMatch, userNameMatch, userEmailMatch, resNameMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return bookingRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    private void createStatusHistory(Booking booking, BookingStatus prev, BookingStatus next, User changedBy, String comment) {
        BookingStatusHistory history = BookingStatusHistory.builder()
                .booking(booking)
                .previousStatus(prev)
                .newStatus(next)
                .changedBy(changedBy)
                .comment(comment)
                .build();
        historyRepository.save(history);
    }

    private int getPolicyInt(String key, int defaultValue) {
        return policyRepository.findByPolicyKey(key)
                .map(p -> {
                    try { return Integer.parseInt(p.getPolicyValue()); } catch (Exception e) { return defaultValue; }
                })
                .orElse(defaultValue);
    }

    private boolean getPolicyBool(String key, boolean defaultValue) {
        return policyRepository.findByPolicyKey(key)
                .map(p -> Boolean.parseBoolean(p.getPolicyValue()))
                .orElse(defaultValue);
    }

    public BookingResponse mapToResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .resourceId(b.getResource().getId())
                .resourceName(b.getResource().getName())
                .resourceType(b.getResource().getType().name())
                .building(b.getResource().getBuilding())
                .roomNumber(b.getResource().getRoomNumber())
                .resourceCapacity(b.getResource().getCapacity())
                .userId(b.getUser().getId())
                .userFullName(b.getUser().getFullName())
                .userEmail(b.getUser().getEmail())
                .userRole(b.getUser().getRole().name())
                .userDepartment(b.getUser().getDepartment())
                .bookingDate(b.getBookingDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .title(b.getTitle())
                .purpose(b.getPurpose())
                .attendeesCount(b.getAttendeesCount())
                .status(b.getStatus())
                .rejectionReason(b.getRejectionReason())
                .cancellationReason(b.getCancellationReason())
                .cancelledById(b.getCancelledBy() != null ? b.getCancelledBy().getId() : null)
                .cancelledByName(b.getCancelledBy() != null ? b.getCancelledBy().getFullName() : null)
                .approvedById(b.getApprovedBy() != null ? b.getApprovedBy().getId() : null)
                .approvedByName(b.getApprovedBy() != null ? b.getApprovedBy().getFullName() : null)
                .decisionTimestamp(b.getDecisionTimestamp())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
