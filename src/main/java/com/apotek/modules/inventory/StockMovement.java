package com.apotek.modules.inventory;

import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
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

    @CreationTimestamp
    private LocalDateTime createdAt;
}
