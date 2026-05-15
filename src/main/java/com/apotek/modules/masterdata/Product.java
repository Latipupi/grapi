package com.apotek.modules.masterdata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
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

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProductUnit> units = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addUnit(ProductUnit unit) {
        units.add(unit);
        unit.setProduct(this);
    }
}
