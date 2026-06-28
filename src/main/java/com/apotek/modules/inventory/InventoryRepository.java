package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByBranchIdAndProductId(Long branchId, Long productId);
    List<Inventory> findByBranchId(Long branchId);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE (:branchId IS NULL OR i.branch.id = :branchId) AND i.stockQuantity <= COALESCE(i.minimumStock, 10)")
    long countLowStockItems(@Param("branchId") Long branchId);

    @Query("SELECT i FROM Inventory i WHERE (:branchId IS NULL OR i.branch.id = :branchId) AND i.stockQuantity <= COALESCE(i.minimumStock, 10)")
    List<Inventory> findLowStockItems(@Param("branchId") Long branchId);
}
