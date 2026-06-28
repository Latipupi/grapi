package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    List<SalesReturn> findByBranchIdOrderByReturnDateDesc(Long branchId);
    List<SalesReturn> findBySaleIdOrderByReturnDateDesc(Long saleId);

    @Query("SELECT COALESCE(SUM(sr.totalRefundAmount), 0) FROM SalesReturn sr WHERE sr.shift.id = :shiftId AND sr.sale.paymentMethod = 'CASH'")
    BigDecimal sumRefundsByShiftId(@Param("shiftId") Long shiftId);
}
