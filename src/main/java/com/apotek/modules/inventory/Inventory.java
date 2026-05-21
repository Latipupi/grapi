package com.apotek.modules.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Inventory {

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
    private BigDecimal stockQuantity; // In Base Unit

    @Column(name = "minimum_stock", nullable = false)
    private BigDecimal minimumStock = new BigDecimal("10.0");

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static InventoryBuilder builder() { return new InventoryBuilder(); }

    public static class InventoryBuilder {
        private Branch branch;
        private Product product;
        private BigDecimal stockQuantity;
        private BigDecimal minimumStock = new BigDecimal("10.0");
        
        public InventoryBuilder branch(Branch branch) { this.branch = branch; return this; }
        public InventoryBuilder product(Product product) { this.product = product; return this; }
        public InventoryBuilder stockQuantity(BigDecimal qty) { this.stockQuantity = qty; return this; }
        public InventoryBuilder minimumStock(BigDecimal min) { this.minimumStock = min; return this; }
        public Inventory build() {
            Inventory inv = new Inventory();
            inv.setBranch(branch);
            inv.setProduct(product);
            inv.setStockQuantity(stockQuantity);
            inv.setMinimumStock(minimumStock);
            return inv;
        }
    }
}
