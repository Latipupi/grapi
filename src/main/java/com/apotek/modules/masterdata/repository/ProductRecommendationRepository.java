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
    @Query("SELECT r FROM ProductRecommendation r WHERE r.sourceProduct.id = :sourceProductId")
    List<ProductRecommendation> findBySourceProductId(@Param("sourceProductId") Long sourceProductId);

    @Query("SELECT r FROM ProductRecommendation r WHERE r.sourceProduct.id = :sourceProductId AND r.relationType = :relationType")
    List<ProductRecommendation> findBySourceProductIdAndRelationType(@Param("sourceProductId") Long sourceProductId, @Param("relationType") String relationType);

    @Query("SELECT r FROM ProductRecommendation r WHERE r.sourceProduct.id = :sourceProductId AND r.targetProduct.id = :targetProductId AND r.relationType = :relationType")
    Optional<ProductRecommendation> findBySourceProductIdAndTargetProductIdAndRelationType(
            @Param("sourceProductId") Long sourceProductId,
            @Param("targetProductId") Long targetProductId,
            @Param("relationType") String relationType
    );

    @Query("SELECT r FROM ProductRecommendation r ORDER BY r.sourceProduct.name ASC, r.relationType ASC")
    List<ProductRecommendation> findAllOrderBySourceName();
}
