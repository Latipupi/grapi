package com.apotek.modules.masterdata;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByTenantIdAndSkuAndBranch_Id(String tenantId, String sku, Long branchId);
    List<Product> findByTenantIdAndSkuAndBranchIsNull(String tenantId, String sku);
    
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) AND p.branch.id = :branchId AND p.active = true")
    List<Product> findByTenantIdAndNameIgnoreCaseAndBranchId(@Param("tenantId") String tenantId, @Param("name") String name, @Param("branchId") Long branchId);
    
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) AND p.branch.id IS NULL AND p.active = true")
    List<Product> findByTenantIdAndNameIgnoreCaseAndBranchIdIsNull(@Param("tenantId") String tenantId, @Param("name") String name);
}
