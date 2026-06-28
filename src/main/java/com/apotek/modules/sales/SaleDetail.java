package com.apotek.modules.sales;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.apotek.modules.inventory.InventoryBatch;
import com.apotek.modules.masterdata.Product;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_details")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SaleDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    @JsonIgnore
    private Sale sale;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private InventoryBatch batch;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @Column(name = "conversion_factor", nullable = false)
    private Integer conversionFactor = 1;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public static SaleDetailBuilder builder() { return new SaleDetailBuilder(); }

    public static class SaleDetailBuilder {
        private Product product;
        private InventoryBatch batch;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private BigDecimal purchasePrice;
        private Integer conversionFactor = 1;
        public SaleDetailBuilder product(Product product) { this.product = product; return this; }
        public SaleDetailBuilder batch(InventoryBatch batch) { this.batch = batch; return this; }
        public SaleDetailBuilder quantity(BigDecimal quantity) { this.quantity = quantity; return this; }
        public SaleDetailBuilder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public SaleDetailBuilder subtotal(BigDecimal subtotal) { this.subtotal = subtotal; return this; }
        public SaleDetailBuilder purchasePrice(BigDecimal price) { this.purchasePrice = price; return this; }
        public SaleDetailBuilder conversionFactor(Integer conversionFactor) { this.conversionFactor = conversionFactor; return this; }
        public SaleDetail build() {
            SaleDetail detail = new SaleDetail();
            detail.setProduct(product);
            detail.setBatch(batch);
            detail.setQuantity(quantity);
            detail.setUnitPrice(unitPrice);
            detail.setSubtotal(subtotal);
            detail.setPurchasePrice(purchasePrice);
            detail.setConversionFactor(conversionFactor);
            return detail;
        }
    }
}
