package com.campus.booking.service;

import com.campus.booking.dto.NotificationResponse;
import com.campus.booking.entity.Booking;
import com.campus.booking.entity.Notification;
import com.campus.booking.entity.NotificationType;
import com.campus.booking.entity.User;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.exception.UnauthorizedOperationException;
import com.campus.booking.repository.NotificationRepository;
import com.campus.booking.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User recipient, Booking booking, String title, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .user(recipient)
                .booking(booking)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", recipient.getEmail(), title);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.countByUserIdAndIsReadFalse(currentUserId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        if (!notification.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedOperationException("Cannot modify notifications belonging to another user");
        }

        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToResponse(updated);
    }

    @Transactional
    public int markAllAsRead() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.markAllAsReadByUserId(currentUserId);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .bookingId(n.getBooking() != null ? n.getBooking().getId() : null)
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
