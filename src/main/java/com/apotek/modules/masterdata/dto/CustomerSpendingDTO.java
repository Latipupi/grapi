package com.apotek.modules.masterdata.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSpendingDTO {
    private Long customerId;
    private String name;
    private String phone;
    private String address;
    private String email;
    private Boolean active;
    private Long transactionCount;
    private BigDecimal totalSpent;
    private BigDecimal averageSpent;
    private LocalDateTime firstPurchaseDate;
    private LocalDateTime lastPurchaseDate;

    public CustomerSpendingDTO(
            Long customerId,
            String name,
            String phone,
            String address,
            String email,
            Boolean active,
            Long transactionCount,
            BigDecimal totalSpent,
            LocalDateTime firstPurchaseDate,
            LocalDateTime lastPurchaseDate
    ) {
        this.customerId = customerId;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.email = email;
        this.active = active != null ? active : true;
        this.transactionCount = transactionCount != null ? transactionCount : 0L;
        this.totalSpent = totalSpent != null ? totalSpent : BigDecimal.ZERO;
        this.firstPurchaseDate = firstPurchaseDate;
        this.lastPurchaseDate = lastPurchaseDate;
        if (this.transactionCount > 0 && this.totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            this.averageSpent = this.totalSpent.divide(BigDecimal.valueOf(this.transactionCount), 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.averageSpent = BigDecimal.ZERO;
        }
    }

    public CustomerSpendingDTO(
            Long customerId,
            String name,
            String phone,
            String address,
            String email,
            boolean active,
            Long transactionCount,
            BigDecimal totalSpent,
            LocalDateTime firstPurchaseDate,
            LocalDateTime lastPurchaseDate
    ) {
        this(customerId, name, phone, address, email, Boolean.valueOf(active), transactionCount, totalSpent, firstPurchaseDate, lastPurchaseDate);
    }
}
