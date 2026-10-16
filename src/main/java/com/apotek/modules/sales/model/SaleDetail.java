package com.apotek.modules.sales.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.inventory.model.InventoryBatch;
import com.apotek.modules.masterdata.model.Product;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    @JoinColumn(name = "product_id")
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

    @Column(name = "conversion_factor", nullable = false)
    private Integer conversionFactor = 1;

    // Compounded prescription fields
    @Column(name = "is_compound", nullable = false)
    private Boolean isCompound = false;

    @Column(name = "compound_name")
    private String compoundName;

    @Column(name = "dose_rule")
    private String doseRule;

    @Column(name = "service_fee")
    private BigDecimal serviceFee = BigDecimal.ZERO;

    @Column(name = "package_type")
    private String packageType; // e.g. Puyer, Kapsul, Salep, Sirup

    @OneToMany(mappedBy = "saleDetail", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @BatchSize(size = 100)
    private List<SaleDetailIngredient> ingredients = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    public void addIngredient(SaleDetailIngredient ingredient) {
        ingredients.add(ingredient);
        ingredient.setSaleDetail(this);
    }

    public static SaleDetailBuilder builder() { return new SaleDetailBuilder(); }

    public static class SaleDetailBuilder {
        private Product product;
        private InventoryBatch batch;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private BigDecimal purchasePrice = BigDecimal.ZERO;
        private Integer conversionFactor = 1;
        private Boolean isCompound = false;
        private String compoundName;
        private String doseRule;
        private BigDecimal serviceFee = BigDecimal.ZERO;
        private String packageType;
        private List<SaleDetailIngredient> ingredients = new ArrayList<>();

        public SaleDetailBuilder product(Product product) { this.product = product; return this; }
        public SaleDetailBuilder batch(InventoryBatch batch) { this.batch = batch; return this; }
        public SaleDetailBuilder quantity(BigDecimal quantity) { this.quantity = quantity; return this; }
        public SaleDetailBuilder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public SaleDetailBuilder subtotal(BigDecimal subtotal) { this.subtotal = subtotal; return this; }
        public SaleDetailBuilder purchasePrice(BigDecimal price) { this.purchasePrice = price != null ? price : BigDecimal.ZERO; return this; }
        public SaleDetailBuilder conversionFactor(Integer conversionFactor) { this.conversionFactor = conversionFactor; return this; }
        public SaleDetailBuilder isCompound(Boolean isCompound) { this.isCompound = isCompound != null ? isCompound : false; return this; }
        public SaleDetailBuilder compoundName(String compoundName) { this.compoundName = compoundName; return this; }
        public SaleDetailBuilder doseRule(String doseRule) { this.doseRule = doseRule; return this; }
        public SaleDetailBuilder serviceFee(BigDecimal serviceFee) { this.serviceFee = serviceFee != null ? serviceFee : BigDecimal.ZERO; return this; }
        public SaleDetailBuilder packageType(String packageType) { this.packageType = packageType; return this; }
        public SaleDetailBuilder ingredients(List<SaleDetailIngredient> ingredients) { this.ingredients = ingredients != null ? ingredients : new ArrayList<>(); return this; }

        public SaleDetail build() {
            SaleDetail detail = new SaleDetail();
            detail.setProduct(product);
            detail.setBatch(batch);
            detail.setQuantity(quantity);
            detail.setUnitPrice(unitPrice);
            detail.setSubtotal(subtotal);
            detail.setPurchasePrice(purchasePrice != null ? purchasePrice : BigDecimal.ZERO);
            detail.setConversionFactor(conversionFactor != null ? conversionFactor : 1);
            detail.setIsCompound(isCompound != null ? isCompound : false);
            detail.setCompoundName(compoundName);
            detail.setDoseRule(doseRule);
            detail.setServiceFee(serviceFee != null ? serviceFee : BigDecimal.ZERO);
            detail.setPackageType(packageType);
            if (ingredients != null) {
                for (SaleDetailIngredient ing : ingredients) {
                    detail.addIngredient(ing);
                }
            }
            return detail;
        }
    }
}
