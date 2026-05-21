package com.apotek.modules.inventory;

import com.apotek.modules.masterdata.Product;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_opname_details")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockOpnameDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opname_id", nullable = false)
    @JsonBackReference
    private StockOpname stockOpname;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_batch_id", nullable = false)
    private InventoryBatch inventoryBatch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "system_quantity", nullable = false)
    private BigDecimal systemQuantity;

    @Column(name = "physical_quantity", nullable = false)
    private BigDecimal physicalQuantity;

    @Column(nullable = false)
    private BigDecimal difference;

    private String reason; // RUSAK, HILANG, LEBIH, KADALUARSA, SALAH_INPUT
}
