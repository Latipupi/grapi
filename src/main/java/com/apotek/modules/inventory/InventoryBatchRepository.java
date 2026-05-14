package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    Optional<InventoryBatch> findByBranchIdAndProductIdAndBatchNumber(Long branchId, Long productId, String batchNumber);
    List<InventoryBatch> findByBranchIdAndProductIdOrderByExpiryDateAsc(Long branchId, Long productId);
    List<InventoryBatch> findByBranchIdOrderByExpiryDateAsc(Long branchId);
}
