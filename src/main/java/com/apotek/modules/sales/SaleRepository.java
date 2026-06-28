package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByBranchIdOrderBySaleDateDesc(Long branchId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.shift.id = :shiftId AND s.paymentMethod = 'CASH' AND s.status = 'COMPLETED'")
    BigDecimal sumCashSalesByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.shift.id = :shiftId AND s.status = 'COMPLETED'")
    BigDecimal sumAllSalesByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT COUNT(s) FROM Sale s WHERE (:branchId IS NULL OR s.branch.id = :branchId) AND s.saleDate >= :start AND s.saleDate <= :end")
    long countSalesByBranchAndDateBetween(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE (:branchId IS NULL OR s.branch.id = :branchId) AND s.saleDate >= :start AND s.saleDate <= :end")
    BigDecimal sumSalesByBranchAndDateBetween(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s FROM Sale s WHERE (:branchId IS NULL OR s.branch.id = :branchId) AND s.saleDate >= :afterDate")
    List<Sale> findByBranchIdAndSaleDateAfter(@Param("branchId") Long branchId, @Param("afterDate") LocalDateTime afterDate);
}
