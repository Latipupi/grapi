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
@Table(name = "sales_return_details")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalesReturnDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_return_id", nullable = false)
    @JsonIgnore
    private SalesReturn salesReturn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_detail_id", nullable = false)
    private SaleDetail saleDetail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private InventoryBatch batch;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
