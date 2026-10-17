package com.apotek.modules.sales.repository;
import com.apotek.modules.sales.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SaleDetailRepository extends JpaRepository<SaleDetail, Long> {
    List<SaleDetail> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<SaleDetail> findBySaleBranchIdAndCreatedAtBetween(Long branchId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT d FROM SaleDetail d JOIN FETCH d.sale s LEFT JOIN FETCH d.product WHERE (:branchId IS NULL OR s.branch.id = :branchId) AND s.saleDate >= :start AND s.saleDate <= :end AND s.status = 'COMPLETED'")
    List<SaleDetail> findCompletedByBranchAndSaleDateBetween(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
