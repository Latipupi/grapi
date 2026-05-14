package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleDetailRepository extends JpaRepository<SaleDetail, Long> {
    List<SaleDetail> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<SaleDetail> findBySaleBranchIdAndCreatedAtBetween(Long branchId, LocalDateTime start, LocalDateTime end);
}
