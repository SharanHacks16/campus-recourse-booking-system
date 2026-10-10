package com.campus.booking.repository;

import com.campus.booking.entity.Resource;
import com.campus.booking.entity.ResourceType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Resource r WHERE r.id = :id")
    Optional<Resource> findByIdWithLock(@Param("id") Long id);

    List<Resource> findByIsActiveTrue();

    Page<Resource> findByIsActiveTrue(Pageable pageable);

    Page<Resource> findByTypeAndIsActiveTrue(ResourceType type, Pageable pageable);

    long countByIsActiveTrue();

    long countByType(ResourceType type);
}
