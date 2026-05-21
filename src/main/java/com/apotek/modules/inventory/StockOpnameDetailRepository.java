package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockOpnameDetailRepository extends JpaRepository<StockOpnameDetail, Long> {
}
