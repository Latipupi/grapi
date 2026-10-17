package com.apotek.modules.debt.repository;
import com.apotek.modules.debt.model.*;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {
    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    List<Debt> findAll();

    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    List<Debt> findByBranchIdOrderByDueDateDesc(Long branchId);

    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    List<Debt> findByTypeOrderByDueDateDesc(String type);

    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    List<Debt> findByBranchIdAndTypeOrderByDueDateDesc(Long branchId, String type);

    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    Optional<Debt> findById(Long id);

    @EntityGraph(attributePaths = {"sale", "sale.customer", "sale.branch", "purchase", "purchase.supplier", "purchase.branch", "branch"})
    Optional<Debt> findBySaleId(Long saleId);

    @Query("SELECT d FROM Debt d " +
           "LEFT JOIN FETCH d.purchase p " +
           "LEFT JOIN FETCH p.supplier " +
           "LEFT JOIN FETCH d.sale s " +
           "LEFT JOIN FETCH s.customer " +
           "LEFT JOIN FETCH d.branch " +
           "WHERE (:branchId IS NULL OR d.branch.id = :branchId) " +
           "AND d.status <> 'PAID' " +
           "ORDER BY d.dueDate ASC")
    List<Debt> findAllUnpaidDebts(@Param("branchId") Long branchId);
}
