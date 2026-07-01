package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesReturnDetailRepository extends JpaRepository<SalesReturnDetail, Long> {
    
    @Query("SELECT COALESCE(SUM(srd.quantity), 0) FROM SalesReturnDetail srd WHERE srd.saleDetail.id = :saleDetailId")
    BigDecimal sumReturnedQuantityBySaleDetailId(@Param("saleDetailId") Long saleDetailId);
    
    List<SalesReturnDetail> findBySaleDetailId(Long saleDetailId);

    @Query("SELECT srd FROM SalesReturnDetail srd WHERE (:branchId IS NULL OR srd.salesReturn.branch.id = :branchId) AND srd.createdAt >= :start AND srd.createdAt <= :end")
    List<SalesReturnDetail> findByBranchIdAndCreatedAtBetween(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
