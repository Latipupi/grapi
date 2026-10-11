package com.apotek.modules.masterdata.repository;

import com.apotek.modules.masterdata.model.ProductRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {
    List<ProductRecommendation> findBySourceProductId(Long sourceProductId);
    List<ProductRecommendation> findBySourceProductIdAndRelationType(Long sourceProductId, String relationType);
    Optional<ProductRecommendation> findBySourceProductIdAndTargetProductIdAndRelationType(Long sourceProductId, Long targetProductId, String relationType);

    @Query("SELECT r FROM ProductRecommendation r ORDER BY r.sourceProduct.name ASC, r.relationType ASC")
    List<ProductRecommendation> findAllOrderBySourceName();
}
