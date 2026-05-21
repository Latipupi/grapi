package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CashierShiftRepository extends JpaRepository<CashierShift, Long> {
    Optional<CashierShift> findFirstByUserIdAndStatusOrderByStartTimeDesc(Long userId, String status);
    Optional<CashierShift> findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(Long userId, Long branchId, String status);
}
