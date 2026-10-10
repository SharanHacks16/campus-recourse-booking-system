package com.campus.booking.service;

import com.campus.booking.dto.BookingResponse;
import com.campus.booking.dto.ResourceRequest;
import com.campus.booking.dto.ResourceResponse;
import com.campus.booking.entity.Booking;
import com.campus.booking.entity.Resource;
import com.campus.booking.entity.ResourceType;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.repository.BookingRepository;
import com.campus.booking.repository.ResourceRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ResourceResponse> searchResources(
            String query,
            ResourceType type,
            Integer minCapacity,
            String building,
            Boolean activeOnly,
            Pageable pageable) {

        Specification<Resource> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (Boolean.TRUE.equals(activeOnly)) {
                predicates.add(cb.isTrue(root.get("isActive")));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (minCapacity != null && minCapacity > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }

            if (StringUtils.hasText(building)) {
                predicates.add(cb.like(cb.lower(root.get("building")), "%" + building.trim().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(query)) {
                String term = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), term);
                Predicate buildingMatch = cb.like(cb.lower(root.get("building")), term);
                Predicate roomMatch = cb.like(cb.lower(root.get("roomNumber")), term);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), term);
                predicates.add(cb.or(nameMatch, buildingMatch, roomMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return resourceRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + id));
        return mapToResponse(resource);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getResourceAvailability(Long resourceId, LocalDate date) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException("Resource not found with ID: " + resourceId);
        }
        List<Booking> bookings = bookingRepository.findActiveBookingsByResourceAndDate(resourceId, date);
        return bookings.stream().map(this::mapBookingToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getResourceAvailabilityRange(Long resourceId, LocalDate startDate, LocalDate endDate) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException("Resource not found with ID: " + resourceId);
        }
        List<Booking> bookings = bookingRepository.findActiveBookingsByResourceAndDateRange(resourceId, startDate, endDate);
        return bookings.stream().map(this::mapBookingToResponse).toList();
    }

    @Transactional
    public ResourceResponse createResource(ResourceRequest request) {
        Resource resource = Resource.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .building(request.getBuilding().trim())
                .roomNumber(request.getRoomNumber().trim())
                .capacity(request.getCapacity())
                .description(request.getDescription())
                .department(request.getDepartment())
                .amenities(request.getAmenities())
                .operatingOpenTime(request.getOperatingOpenTime())
                .operatingCloseTime(request.getOperatingCloseTime())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .imageUrl(request.getImageUrl())
                .build();

        Resource saved = resourceRepository.save(resource);
        auditService.logAction("RESOURCE_CREATED", "RESOURCE", saved.getId(), "Created resource: " + saved.getName());
        return mapToResponse(saved);
    }

    @Transactional
    public ResourceResponse updateResource(Long id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + id));

        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setBuilding(request.getBuilding().trim());
        resource.setRoomNumber(request.getRoomNumber().trim());
        resource.setCapacity(request.getCapacity());
        resource.setDescription(request.getDescription());
        resource.setDepartment(request.getDepartment());
        resource.setAmenities(request.getAmenities());
        resource.setOperatingOpenTime(request.getOperatingOpenTime());
        resource.setOperatingCloseTime(request.getOperatingCloseTime());
        if (request.getIsActive() != null) {
            resource.setIsActive(request.getIsActive());
        }
        resource.setImageUrl(request.getImageUrl());

        Resource updated = resourceRepository.save(resource);
        auditService.logAction("RESOURCE_UPDATED", "RESOURCE", updated.getId(), "Updated resource: " + updated.getName());
        return mapToResponse(updated);
    }

    @Transactional
    public ResourceResponse toggleStatus(Long id, Boolean active) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + id));

        resource.setIsActive(active);
        Resource updated = resourceRepository.save(resource);
        auditService.logAction("RESOURCE_STATUS_CHANGED", "RESOURCE", updated.getId(), "Status changed to: " + (active ? "ACTIVE" : "INACTIVE"));
        return mapToResponse(updated);
    }

    public ResourceResponse mapToResponse(Resource r) {
        return ResourceResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .type(r.getType())
                .building(r.getBuilding())
                .roomNumber(r.getRoomNumber())
                .capacity(r.getCapacity())
                .description(r.getDescription())
                .department(r.getDepartment())
                .amenities(r.getAmenities())
                .operatingOpenTime(r.getOperatingOpenTime())
                .operatingCloseTime(r.getOperatingCloseTime())
                .isActive(r.getIsActive())
                .imageUrl(r.getImageUrl())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private BookingResponse mapBookingToResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .resourceId(b.getResource().getId())
                .resourceName(b.getResource().getName())
                .resourceType(b.getResource().getType().name())
                .building(b.getResource().getBuilding())
                .roomNumber(b.getResource().getRoomNumber())
                .bookingDate(b.getBookingDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .title(b.getTitle())
                .status(b.getStatus())
                .attendeesCount(b.getAttendeesCount())
                .build();
    }
}
