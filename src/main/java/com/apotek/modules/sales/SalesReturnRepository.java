package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    List<SalesReturn> findByBranchIdOrderByReturnDateDesc(Long branchId);
    List<SalesReturn> findBySaleIdOrderByReturnDateDesc(Long saleId);

    @Query("SELECT COALESCE(SUM(sr.totalRefundAmount), 0) FROM SalesReturn sr WHERE sr.shift.id = :shiftId AND sr.sale.paymentMethod = 'CASH'")
    BigDecimal sumRefundsByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT COALESCE(SUM(sr.totalRefundAmount), 0) FROM SalesReturn sr WHERE (:branchId IS NULL OR sr.branch.id = :branchId) AND sr.returnDate >= :start AND sr.returnDate <= :end")
    BigDecimal sumRefundsByBranchAndDateBetween(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(sr.totalRefundAmount), 0) FROM SalesReturn sr WHERE sr.shift.id = :shiftId")
    BigDecimal sumAllRefundsByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT sr FROM SalesReturn sr WHERE (:branchId IS NULL OR sr.branch.id = :branchId) AND sr.returnDate >= :afterDate")
    List<SalesReturn> findByBranchIdAndReturnDateAfter(@Param("branchId") Long branchId, @Param("afterDate") LocalDateTime afterDate);
}
