package com.apotek.modules.sales;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CashierShiftRepository extends JpaRepository<CashierShift, Long> {
    
    @Override
    @EntityGraph(attributePaths = {"branch", "user"})
    List<CashierShift> findAll();

    @EntityGraph(attributePaths = {"branch", "user"})
    Optional<CashierShift> findFirstByUserIdAndStatusOrderByStartTimeDesc(Long userId, String status);

    @EntityGraph(attributePaths = {"branch", "user"})
    Optional<CashierShift> findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(Long userId, Long branchId, String status);
}
