package com.apotek.modules.masterdata.repository;
import com.apotek.modules.masterdata.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductUnitRepository extends JpaRepository<ProductUnit, Long> {
}
