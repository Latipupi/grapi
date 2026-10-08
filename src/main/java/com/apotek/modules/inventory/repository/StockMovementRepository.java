package com.apotek.modules.inventory.repository;
import com.apotek.modules.inventory.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByBranchIdAndProductIdOrderByCreatedAtDesc(Long branchId, Long productId);
    List<StockMovement> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<StockMovement> findTop10ByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<StockMovement> findTop10ByOrderByCreatedAtDesc();
}
