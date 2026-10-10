package com.campus.booking.service;

import com.campus.booking.dto.BookingRequest;
import com.campus.booking.dto.BookingResponse;
import com.campus.booking.dto.CancelBookingRequest;
import com.campus.booking.dto.RejectBookingRequest;
import com.campus.booking.entity.*;
import com.campus.booking.exception.BookingConflictException;
import com.campus.booking.exception.InvalidBookingStateException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.*;
import com.campus.booking.security.SecurityUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingStatusHistoryRepository historyRepository;

    @Mock
    private BookingPolicyRepository policyRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BookingService bookingService;

    private User studentUser;
    private User adminUser;
    private Resource classroom;

    @BeforeEach
    void setUp() {
        studentUser = User.builder()
                .id(1L)
                .email("student@campus.edu")
                .fullName("Sarah Connor")
                .role(Role.STUDENT)
                .department("Computer Science")
                .active(true)
                .build();

        adminUser = User.builder()
                .id(99L)
                .email("admin@campus.edu")
                .fullName("Dr. Eleanor Vance")
                .role(Role.ADMIN)
                .department("Administration")
                .active(true)
                .build();

        classroom = Resource.builder()
                .id(10L)
                .name("Smart Lecture Hall A")
                .type(ResourceType.CLASSROOM)
                .building("Complex 1")
                .roomNumber("101")
                .capacity(50)
                .operatingOpenTime(LocalTime.of(8, 0))
                .operatingCloseTime(LocalTime.of(21, 0))
                .isActive(true)
                .build();

        // Setup security context with studentUser
        SecurityUser secUser = SecurityUser.fromUser(studentUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(secUser, null, secUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should successfully create a booking when valid and no conflicts exist")
    void testCreateBookingSuccess() {
        LocalDate futureDate = LocalDate.now().plusDays(5);
        BookingRequest request = BookingRequest.builder()
                .resourceId(10L)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .title("Algorithms Study Group")
                .purpose("Exam revision session")
                .attendeesCount(30)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(studentUser));
        when(resourceRepository.findByIdWithLock(10L)).thenReturn(Optional.of(classroom));
        when(bookingRepository.findConflictingBookings(eq(10L), eq(futureDate), any(), any(), any())).thenReturn(Collections.emptyList());

        Booking savedBooking = Booking.builder()
                .id(100L)
                .resource(classroom)
                .user(studentUser)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .title(request.getTitle())
                .purpose(request.getPurpose())
                .attendeesCount(30)
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse response = bookingService.createBooking(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(BookingStatus.PENDING, response.getStatus());
        verify(historyRepository).save(any());
        verify(notificationService).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject booking if attendees count exceeds resource capacity")
    void testCreateBookingExceedsCapacity() {
        LocalDate futureDate = LocalDate.now().plusDays(5);
        BookingRequest request = BookingRequest.builder()
                .resourceId(10L)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .title("Mega Event")
                .purpose("Too many attendees")
                .attendeesCount(100) // Capacity is 50
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(studentUser));
        when(resourceRepository.findByIdWithLock(10L)).thenReturn(Optional.of(classroom));

        InvalidBookingStateException ex = assertThrows(InvalidBookingStateException.class, () -> {
            bookingService.createBooking(request);
        });

        assertTrue(ex.getMessage().contains("exceeds maximum facility capacity"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BookingConflictException on overlapping time interval")
    void testCreateBookingOverlapConflict() {
        LocalDate futureDate = LocalDate.now().plusDays(3);
        BookingRequest request = BookingRequest.builder()
                .resourceId(10L)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(13, 0))
                .title("Overlapping Session")
                .purpose("Conflict test")
                .attendeesCount(20)
                .build();

        Booking existingBooking = Booking.builder()
                .id(200L)
                .resource(classroom)
                .user(studentUser)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .status(BookingStatus.APPROVED)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(studentUser));
        when(resourceRepository.findByIdWithLock(10L)).thenReturn(Optional.of(classroom));
        when(bookingRepository.findConflictingBookings(eq(10L), eq(futureDate), any(), any(), any()))
                .thenReturn(List.of(existingBooking));

        BookingConflictException ex = assertThrows(BookingConflictException.class, () -> {
            bookingService.createBooking(request);
        });

        assertTrue(ex.getMessage().contains("Conflicting reservation exists"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow user to cancel their own pending booking")
    void testCancelOwnBooking() {
        Booking booking = Booking.builder()
                .id(300L)
                .resource(classroom)
                .user(studentUser)
                .bookingDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(16, 0))
                .status(BookingStatus.PENDING)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(studentUser));
        when(bookingRepository.findById(300L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.cancelBooking(300L, new CancelBookingRequest("Plan cancelled"));

        assertEquals(BookingStatus.CANCELLED, response.getStatus());
        verify(notificationService).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should prevent user from cancelling another user's reservation")
    void testUnauthorizedCancellation() {
        User anotherUser = User.builder().id(999L).email("other@campus.edu").role(Role.STUDENT).build();
        Booking booking = Booking.builder()
                .id(400L)
                .resource(classroom)
                .user(anotherUser)
                .bookingDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(16, 0))
                .status(BookingStatus.PENDING)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(studentUser));
        when(bookingRepository.findById(400L)).thenReturn(Optional.of(booking));

        assertThrows(UnauthorizedOperationException.class, () -> {
            bookingService.cancelBooking(400L, new CancelBookingRequest("Sneaky cancel"));
        });
    }

    @Test
    @DisplayName("Admin approval should transition PENDING to APPROVED")
    void testAdminApproveBooking() {
        // Switch context to Admin
        SecurityUser secAdmin = SecurityUser.fromUser(adminUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(secAdmin, null, secAdmin.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Booking booking = Booking.builder()
                .id(500L)
                .resource(classroom)
                .user(studentUser)
                .bookingDate(LocalDate.now().plusDays(4))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .status(BookingStatus.PENDING)
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(booking));
        when(resourceRepository.findByIdWithLock(10L)).thenReturn(Optional.of(classroom));
        when(bookingRepository.findConflictingBookingsExcludingId(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.approveBooking(500L);

        assertEquals(BookingStatus.APPROVED, response.getStatus());
        verify(notificationService).createNotification(eq(studentUser), any(), contains("Approved"), any(), any());
    }

    @Test
    @DisplayName("Admin rejection should record reason and update status")
    void testAdminRejectBooking() {
        SecurityUser secAdmin = SecurityUser.fromUser(adminUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(secAdmin, null, secAdmin.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Booking booking = Booking.builder()
                .id(600L)
                .resource(classroom)
                .user(studentUser)
                .bookingDate(LocalDate.now().plusDays(4))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .status(BookingStatus.PENDING)
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findById(600L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.rejectBooking(600L, new RejectBookingRequest("Room undergoing maintenance"));

        assertEquals(BookingStatus.REJECTED, response.getStatus());
        assertEquals("Room undergoing maintenance", response.getRejectionReason());
    }
}
