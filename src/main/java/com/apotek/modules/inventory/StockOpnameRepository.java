package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockOpnameRepository extends JpaRepository<StockOpname, Long> {
    List<StockOpname> findByBranchIdOrderByOpnameDateDesc(Long branchId);
}
