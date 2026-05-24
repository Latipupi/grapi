package com.apotek.modules.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "inventory_batches")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String batchNumber;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Column(nullable = false)
    private BigDecimal currentQuantity;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        if (this.tenantId == null) {
            this.tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        }
    }

    public static InventoryBatchBuilder builder() { return new InventoryBatchBuilder(); }

    public static class InventoryBatchBuilder {
        private Branch branch;
        private Product product;
        private String batchNumber;
        private LocalDate expiryDate;
        private BigDecimal currentQuantity;
        private BigDecimal purchasePrice;
        private String tenantId;
        public InventoryBatchBuilder branch(Branch branch) { this.branch = branch; return this; }
        public InventoryBatchBuilder product(Product product) { this.product = product; return this; }
        public InventoryBatchBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public InventoryBatchBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public InventoryBatchBuilder currentQuantity(BigDecimal qty) { this.currentQuantity = qty; return this; }
        public InventoryBatchBuilder purchasePrice(BigDecimal price) { this.purchasePrice = price; return this; }
        public InventoryBatchBuilder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public InventoryBatch build() {
            InventoryBatch batch = new InventoryBatch();
            batch.setBranch(branch);
            batch.setProduct(product);
            batch.setBatchNumber(batchNumber);
            batch.setExpiryDate(expiryDate);
            batch.setCurrentQuantity(currentQuantity);
            batch.setPurchasePrice(purchasePrice);
            batch.setTenantId(tenantId);
            return batch;
        }
    }
}
