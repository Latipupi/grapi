package com.apotek.modules.sales.repository;

import com.apotek.modules.sales.model.SaleDetailIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleDetailIngredientRepository extends JpaRepository<SaleDetailIngredient, Long> {
    List<SaleDetailIngredient> findBySaleDetailId(Long saleDetailId);
    List<SaleDetailIngredient> findByProductId(Long productId);
}
