package com.apotek.modules.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "stock_movements")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockMovement {

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
    private String type; // IN, OUT, ADJUSTMENT, TRANSFER

    @Column(nullable = false)
    private BigDecimal quantity;

    private String batchNumber;
    private LocalDate expiryDate;

    private String referenceNumber; // PO Number, Sales Number, etc.
    private String notes;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.tenantId == null) {
            this.tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        }
    }

    public static StockMovementBuilder builder() { return new StockMovementBuilder(); }

    public static class StockMovementBuilder {
        private Branch branch;
        private Product product;
        private String type;
        private BigDecimal quantity;
        private String batchNumber;
        private LocalDate expiryDate;
        private String referenceNumber;
        private String notes;
        private BigDecimal purchasePrice;
        private String tenantId;
        public StockMovementBuilder branch(Branch branch) { this.branch = branch; return this; }
        public StockMovementBuilder product(Product product) { this.product = product; return this; }
        public StockMovementBuilder type(String type) { this.type = type; return this; }
        public StockMovementBuilder quantity(BigDecimal qty) { this.quantity = qty; return this; }
        public StockMovementBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public StockMovementBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public StockMovementBuilder referenceNumber(String ref) { this.referenceNumber = ref; return this; }
        public StockMovementBuilder notes(String notes) { this.notes = notes; return this; }
        public StockMovementBuilder purchasePrice(BigDecimal price) { this.purchasePrice = price; return this; }
        public StockMovementBuilder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public StockMovement build() {
            StockMovement m = new StockMovement();
            m.setBranch(branch);
            m.setProduct(product);
            m.setType(type);
            m.setQuantity(quantity);
            m.setBatchNumber(batchNumber);
            m.setExpiryDate(expiryDate);
            m.setReferenceNumber(referenceNumber);
            m.setNotes(notes);
            m.setPurchasePrice(purchasePrice);
            m.setTenantId(tenantId);
            return m;
        }
    }
}
