package com.apotek.modules.masterdata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "products")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Transient
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Long categoryId;

    @Transient
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Long supplierId;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String sku;

    private String barcode;
    private String description;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProductUnit> units = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    @JsonProperty
    private java.math.BigDecimal initialStock;

    @Transient
    @JsonProperty
    private Long stockBranchId;

    @Transient
    @JsonProperty
    private java.math.BigDecimal initialPurchasePrice;

    // Virtual field for API convenience - Base Unit Name
    @JsonProperty("unit")
    public String getUnit() {
        if (units == null || units.isEmpty()) return null;
        return units.stream()
                .filter(ProductUnit::isBaseUnit)
                .map(ProductUnit::getUnitName)
                .findFirst()
                .orElse(units.get(0).getUnitName());
    }

    // Virtual field for API convenience - Base Unit Price
    @JsonProperty("sellingPrice")
    public BigDecimal getSellingPrice() {
        if (units == null || units.isEmpty()) return BigDecimal.ZERO;
        return units.stream()
                .filter(ProductUnit::isBaseUnit)
                .map(ProductUnit::getPricePerUnit)
                .findFirst()
                .orElse(units.get(0).getPricePerUnit());
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (this.tenantId == null) {
            this.tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        }
        ensureSkuAndBarcode();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        ensureSkuAndBarcode();
    }

    private void ensureSkuAndBarcode() {
        if (this.sku == null || this.sku.trim().isEmpty()) {
            this.sku = generateUniqueSku();
        } else {
            this.sku = this.sku.trim();
        }
        
        if (this.barcode == null || this.barcode.trim().isEmpty()) {
            this.barcode = generateUniqueBarcode();
        } else {
            this.barcode = this.barcode.trim();
        }
    }

    private String generateUniqueSku() {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyMMdd");
        String dateStr = java.time.LocalDate.now().format(formatter);
        String randomStr = java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "SKU-" + dateStr + "-" + randomStr;
    }

    private String generateUniqueBarcode() {
        long baseNum = System.currentTimeMillis() % 1000000000L;
        String midStr = String.format("%09d", baseNum);
        String barcodeWithoutChecksum = "999" + midStr;
        
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(barcodeWithoutChecksum.charAt(i));
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int checksum = (10 - (sum % 10)) % 10;
        
        return barcodeWithoutChecksum + checksum;
    }

    public void addUnit(ProductUnit unit) {
        units.add(unit);
        unit.setProduct(this);
    }
}
