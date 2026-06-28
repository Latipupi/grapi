package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    Optional<InventoryBatch> findByBranchIdAndProductIdAndBatchNumber(Long branchId, Long productId, String batchNumber);
    List<InventoryBatch> findByBranchIdAndProductIdOrderByExpiryDateAsc(Long branchId, Long productId);
    List<InventoryBatch> findByBranchIdOrderByExpiryDateAsc(Long branchId);

    @Query("SELECT COUNT(b) FROM InventoryBatch b WHERE (:branchId IS NULL OR b.branch.id = :branchId) AND b.expiryDate < :expiryLimit AND b.currentQuantity > 0")
    long countExpiredBatches(@Param("branchId") Long branchId, @Param("expiryLimit") LocalDate expiryLimit);

    @Query("SELECT b FROM InventoryBatch b WHERE (:branchId IS NULL OR b.branch.id = :branchId) AND b.expiryDate < :expiryLimit AND b.currentQuantity > 0")
    List<InventoryBatch> findExpiringBatches(@Param("branchId") Long branchId, @Param("expiryLimit") LocalDate expiryLimit);
}
