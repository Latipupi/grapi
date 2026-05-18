package com.apotek.modules.purchasing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByBranchIdOrderByPurchaseDateDesc(Long branchId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"supplier", "branch", "details", "details.product"})
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Purchase p WHERE p.id = :id")
    java.util.Optional<Purchase> findByIdWithDetails(@org.springframework.data.repository.query.Param("id") Long id);
}
