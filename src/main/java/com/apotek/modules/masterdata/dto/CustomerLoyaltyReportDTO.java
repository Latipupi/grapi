package com.apotek.modules.masterdata.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLoyaltyReportDTO {
    private long totalCustomers;
    private long activeCustomers;
    private BigDecimal totalCustomerSpending;
    private BigDecimal averageSpendingPerCustomer;
    private String topSpenderName;
    private BigDecimal topSpenderAmount;
    private String mostFrequentCustomerName;
    private long mostFrequentCount;
    private List<CustomerSpendingDTO> customers;
}
