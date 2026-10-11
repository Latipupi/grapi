package com.apotek.modules.sales.model;

import com.apotek.modules.inventory.model.InventoryBatch;
import com.apotek.modules.masterdata.model.Product;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sale_detail_ingredients")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SaleDetailIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_detail_id", nullable = false)
    @JsonIgnore
    private SaleDetail saleDetail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    private InventoryBatch batch;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public static SaleDetailIngredientBuilder builder() {
        return new SaleDetailIngredientBuilder();
    }

    public static class SaleDetailIngredientBuilder {
        private Product product;
        private InventoryBatch batch;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private BigDecimal purchasePrice = BigDecimal.ZERO;

        public SaleDetailIngredientBuilder product(Product product) {
            this.product = product;
            return this;
        }

        public SaleDetailIngredientBuilder batch(InventoryBatch batch) {
            this.batch = batch;
            return this;
        }

        public SaleDetailIngredientBuilder quantity(BigDecimal quantity) {
            this.quantity = quantity;
            return this;
        }

        public SaleDetailIngredientBuilder unitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
            return this;
        }

        public SaleDetailIngredientBuilder subtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public SaleDetailIngredientBuilder purchasePrice(BigDecimal purchasePrice) {
            this.purchasePrice = purchasePrice;
            return this;
        }

        public SaleDetailIngredient build() {
            SaleDetailIngredient ingredient = new SaleDetailIngredient();
            ingredient.setProduct(product);
            ingredient.setBatch(batch);
            ingredient.setQuantity(quantity);
            ingredient.setUnitPrice(unitPrice);
            ingredient.setSubtotal(subtotal);
            ingredient.setPurchasePrice(purchasePrice != null ? purchasePrice : BigDecimal.ZERO);
            return ingredient;
        }
    }
}
