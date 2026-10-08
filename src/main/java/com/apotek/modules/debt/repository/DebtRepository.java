package com.apotek.modules.debt.repository;
import com.apotek.modules.debt.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {
    List<Debt> findByBranchIdOrderByDueDateDesc(Long branchId);
    List<Debt> findByTypeOrderByDueDateDesc(String type);
    List<Debt> findByBranchIdAndTypeOrderByDueDateDesc(Long branchId, String type);
    java.util.Optional<Debt> findBySaleId(Long saleId);
}
