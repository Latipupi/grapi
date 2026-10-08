package com.apotek.modules.inventory.repository;
import com.apotek.modules.inventory.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockOpnameDetailRepository extends JpaRepository<StockOpnameDetail, Long> {
}
