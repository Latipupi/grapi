package com.apotek.modules.masterdata.service;

import com.apotek.modules.masterdata.dto.CustomerLoyaltyReportDTO;
import com.apotek.modules.masterdata.dto.CustomerSpendingDTO;
import com.apotek.modules.masterdata.model.Customer;
import com.apotek.modules.masterdata.repository.CustomerRepository;
import com.apotek.modules.sales.repository.SalesReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SalesReturnRepository salesReturnRepository;

    @Transactional(readOnly = true)
    public CustomerLoyaltyReportDTO getCustomerLoyaltyReport(
            Long branchId,
            String startDate,
            String endDate,
            String sortBy,
            Boolean includeAll
    ) {
        LocalDateTime start = startDate != null && !startDate.isBlank()
                ? LocalDate.parse(startDate).atStartOfDay()
                : LocalDateTime.of(2000, 1, 1, 0, 0, 0);

        LocalDateTime end = endDate != null && !endDate.isBlank()
                ? LocalDate.parse(endDate).atTime(23, 59, 59)
                : LocalDateTime.now().plusDays(1);

        List<CustomerSpendingDTO> spendingList = customerRepository.findCustomerSpendingSummary(branchId, start, end);
        List<Object[]> refundSummaries = salesReturnRepository.findCustomerRefundSummary(branchId, start, end);

        Map<Long, CustomerSpendingDTO> customerMap = new LinkedHashMap<>();
        for (CustomerSpendingDTO dto : spendingList) {
            customerMap.put(dto.getCustomerId(), dto);
        }

        // Deduct refunds if any
        for (Object[] refund : refundSummaries) {
            if (refund.length >= 2 && refund[0] != null) {
                Long customerId = (Long) refund[0];
                BigDecimal refundAmount = (BigDecimal) refund[1];
                CustomerSpendingDTO dto = customerMap.get(customerId);
                if (dto != null && refundAmount != null) {
                    BigDecimal netSpent = dto.getTotalSpent().subtract(refundAmount);
                    dto.setTotalSpent(netSpent.compareTo(BigDecimal.ZERO) > 0 ? netSpent : BigDecimal.ZERO);
                    if (dto.getTransactionCount() > 0 && dto.getTotalSpent().compareTo(BigDecimal.ZERO) > 0) {
                        dto.setAverageSpent(dto.getTotalSpent().divide(BigDecimal.valueOf(dto.getTransactionCount()), 2, RoundingMode.HALF_UP));
                    } else {
                        dto.setAverageSpent(BigDecimal.ZERO);
                    }
                }
            }
        }

        // Include inactive / 0-transaction customers if requested
        if (Boolean.TRUE.equals(includeAll)) {
            List<Customer> allCustomers = customerRepository.findAll();
            for (Customer c : allCustomers) {
                if (!customerMap.containsKey(c.getId())) {
                    customerMap.put(c.getId(), CustomerSpendingDTO.builder()
                            .customerId(c.getId())
                            .name(c.getName())
                            .phone(c.getPhone())
                            .address(c.getAddress())
                            .email(c.getEmail())
                            .active(c.isActive())
                            .transactionCount(0L)
                            .totalSpent(BigDecimal.ZERO)
                            .averageSpent(BigDecimal.ZERO)
                            .firstPurchaseDate(null)
                            .lastPurchaseDate(null)
                            .build());
                }
            }
        }

        List<CustomerSpendingDTO> resultList = new ArrayList<>(customerMap.values());

        // Sort results
        if ("TRANSACTION_COUNT".equalsIgnoreCase(sortBy)) {
            resultList.sort((a, b) -> {
                int cmp = Long.compare(b.getTransactionCount(), a.getTransactionCount());
                return cmp != 0 ? cmp : b.getTotalSpent().compareTo(a.getTotalSpent());
            });
        } else {
            // Default sort by totalSpent DESC
            resultList.sort((a, b) -> {
                int cmp = b.getTotalSpent().compareTo(a.getTotalSpent());
                return cmp != 0 ? cmp : Long.compare(b.getTransactionCount(), a.getTransactionCount());
            });
        }

        // Calculate summary metrics
        long totalCustomersInDb = customerRepository.count();
        long activeCount = resultList.stream().filter(c -> c.getTransactionCount() > 0).count();

        BigDecimal totalCustomerSpending = resultList.stream()
                .map(CustomerSpendingDTO::getTotalSpent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgSpending = activeCount > 0
                ? totalCustomerSpending.divide(BigDecimal.valueOf(activeCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Top Spender
        CustomerSpendingDTO topSpender = resultList.stream()
                .filter(c -> c.getTotalSpent().compareTo(BigDecimal.ZERO) > 0)
                .max(Comparator.comparing(CustomerSpendingDTO::getTotalSpent))
                .orElse(null);

        // Most Frequent
        CustomerSpendingDTO mostFrequent = resultList.stream()
                .filter(c -> c.getTransactionCount() > 0)
                .max(Comparator.comparing(CustomerSpendingDTO::getTransactionCount))
                .orElse(null);

        return CustomerLoyaltyReportDTO.builder()
                .totalCustomers(totalCustomersInDb)
                .activeCustomers(activeCount)
                .totalCustomerSpending(totalCustomerSpending)
                .averageSpendingPerCustomer(avgSpending)
                .topSpenderName(topSpender != null ? topSpender.getName() : "-")
                .topSpenderAmount(topSpender != null ? topSpender.getTotalSpent() : BigDecimal.ZERO)
                .mostFrequentCustomerName(mostFrequent != null ? mostFrequent.getName() : "-")
                .mostFrequentCount(mostFrequent != null ? mostFrequent.getTransactionCount() : 0L)
                .customers(resultList)
                .build();
    }
}
