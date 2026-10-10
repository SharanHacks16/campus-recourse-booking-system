package com.campus.booking.config;

import com.campus.booking.entity.*;
import com.campus.booking.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing campus database default users and demo records...");

        // 1. Seed Users if not present
        User admin = seedUserIfNotFound(
                "admin@campus.edu",
                "Password@123",
                "Dr. Eleanor Vance",
                Role.ADMIN,
                "Facilities & IT Administration",
                "+1 (555) 019-2831",
                "ADM-001"
        );

        User faculty = seedUserIfNotFound(
                "faculty@campus.edu",
                "Password@123",
                "Prof. Alan Turing",
                Role.FACULTY,
                "Computer Science & Engineering",
                "+1 (555) 018-9922",
                "FAC-102"
        );

        User student = seedUserIfNotFound(
                "student@campus.edu",
                "Password@123",
                "Sarah Connor",
                Role.STUDENT,
                "Computer Science & Engineering",
                "+1 (555) 014-7711",
                "STU-8821"
        );

        User student2 = seedUserIfNotFound(
                "student2@campus.edu",
                "Password@123",
                "Alex Rivera",
                Role.STUDENT,
                "School of Management",
                "+1 (555) 015-3344",
                "STU-9943"
        );

        // 2. Seed Initial Bookings if empty
        if (bookingRepository.count() == 0) {
            List<Resource> resources = resourceRepository.findAll();
            if (!resources.isEmpty()) {
                Resource classRoom = resources.stream()
                        .filter(r -> r.getType() == ResourceType.CLASSROOM)
                        .findFirst()
                        .orElse(resources.get(0));

                Resource lab = resources.stream()
                        .filter(r -> r.getType() == ResourceType.LABORATORY)
                        .findFirst()
                        .orElse(resources.get(0));

                Resource auditorium = resources.stream()
                        .filter(r -> r.getType() == ResourceType.AUDITORIUM)
                        .findFirst()
                        .orElse(resources.get(0));

                LocalDate tomorrow = LocalDate.now().plusDays(1);
                LocalDate inTwoDays = LocalDate.now().plusDays(2);
                LocalDate nextWeek = LocalDate.now().plusDays(5);

                // Booking 1: APPROVED Faculty Reservation
                Booking b1 = Booking.builder()
                        .resource(classRoom)
                        .user(faculty)
                        .bookingDate(tomorrow)
                        .startTime(LocalTime.of(10, 0))
                        .endTime(LocalTime.of(12, 0))
                        .title("CS401: Distributed Systems Lecture")
                        .purpose("Regular semester theory lecture and interactive lab exercise briefing.")
                        .attendeesCount(40)
                        .status(BookingStatus.APPROVED)
                        .approvedBy(admin)
                        .decisionTimestamp(LocalDateTime.now().minusHours(2))
                        .build();
                b1 = bookingRepository.save(b1);

                historyRepository.save(BookingStatusHistory.builder()
                        .booking(b1)
                        .newStatus(BookingStatus.APPROVED)
                        .changedBy(admin)
                        .comment("Approved for scheduled department academic lecture")
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(faculty)
                        .booking(b1)
                        .title("Booking Approved")
                        .message("Your reservation for " + classRoom.getName() + " on " + tomorrow + " (10:00 - 12:00) has been APPROVED.")
                        .type(NotificationType.BOOKING_APPROVED)
                        .isRead(true)
                        .build());

                // Booking 2: PENDING Student Request (Ready for Admin Review!)
                Booking b2 = Booking.builder()
                        .resource(lab)
                        .user(student)
                        .bookingDate(inTwoDays)
                        .startTime(LocalTime.of(14, 0))
                        .endTime(LocalTime.of(16, 30))
                        .title("Robotics Club Autonomous Drone Workshop")
                        .purpose("Hands-on calibration and simulation testing for university robotics competition team.")
                        .attendeesCount(25)
                        .status(BookingStatus.PENDING)
                        .build();
                b2 = bookingRepository.save(b2);

                historyRepository.save(BookingStatusHistory.builder()
                        .booking(b2)
                        .newStatus(BookingStatus.PENDING)
                        .changedBy(student)
                        .comment("Submitted booking request")
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(student)
                        .booking(b2)
                        .title("Booking Request Submitted")
                        .message("Your reservation request for " + lab.getName() + " on " + inTwoDays + " (14:00 - 16:30) is currently pending admin review.")
                        .type(NotificationType.BOOKING_SUBMITTED)
                        .isRead(false)
                        .build());

                // Booking 3: APPROVED Auditorium Event
                Booking b3 = Booking.builder()
                        .resource(auditorium)
                        .user(faculty)
                        .bookingDate(nextWeek)
                        .startTime(LocalTime.of(14, 0))
                        .endTime(LocalTime.of(18, 0))
                        .title("National AI & Innovation Symposium 2026")
                        .purpose("Annual campus-wide research showcase with invited keynote speakers and panel discussion.")
                        .attendeesCount(280)
                        .status(BookingStatus.APPROVED)
                        .approvedBy(admin)
                        .decisionTimestamp(LocalDateTime.now().minusDays(1))
                        .build();
                b3 = bookingRepository.save(b3);

                historyRepository.save(BookingStatusHistory.builder()
                        .booking(b3)
                        .newStatus(BookingStatus.APPROVED)
                        .changedBy(admin)
                        .comment("Approved for campus symposium")
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(faculty)
                        .booking(b3)
                        .title("Booking Approved")
                        .message("Your reservation for " + auditorium.getName() + " on " + nextWeek + " (14:00 - 18:00) has been APPROVED.")
                        .type(NotificationType.BOOKING_APPROVED)
                        .isRead(false)
                        .build());

                log.info("Successfully seeded initial demo bookings and notifications.");
            }
        }

        log.info("Campus booking system bootstrap complete.");
    }

    private User seedUserIfNotFound(String email, String rawPassword, String name, Role role, String dept, String phone, String uid) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .fullName(name)
                    .role(role)
                    .department(dept)
                    .phone(phone)
                    .universityId(uid)
                    .active(true)
                    .build();
            User saved = userRepository.save(newUser);
            log.info("Seeded user [{}] with role [{}]", email, role);
            return saved;
        });
    }
}
