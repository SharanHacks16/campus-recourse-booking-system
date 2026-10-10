package com.campus.booking.repository;

import com.campus.booking.entity.BookingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {
    Optional<BookingPolicy> findByPolicyKey(String policyKey);
}
