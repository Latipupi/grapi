package com.apotek.modules.expenses.service;
import com.apotek.modules.expenses.model.*;
import com.apotek.modules.expenses.repository.*;

import com.apotek.modules.sales.model.SaleDetail;
import com.apotek.modules.sales.model.SalesReturnDetail;
import com.apotek.modules.sales.repository.SaleDetailRepository;
import com.apotek.modules.sales.repository.SalesReturnDetailRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final SaleDetailRepository saleDetailRepository;
    private final SalesReturnDetailRepository salesReturnDetailRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public ProfitLossReport getProfitLossReport(Long branchId, LocalDate startDate, LocalDate endDate) {
        if (branchId != null && branchId <= 0) {
            branchId = null;
        }
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        List<SaleDetail> details = saleDetailRepository.findCompletedByBranchAndSaleDateBetween(branchId, start, end);
        List<SalesReturnDetail> returnDetails = salesReturnDetailRepository.findByBranchIdAndCreatedAtBetween(branchId, start, end);

        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal grossCost = BigDecimal.ZERO;
        Map<String, ItemBreakdown> itemMap = new LinkedHashMap<>();

        for (SaleDetail detail : details) {
            BigDecimal rev = detail.getSubtotal() != null ? detail.getSubtotal() : BigDecimal.ZERO;
            BigDecimal purchasePrice = detail.getPurchasePrice() != null ? detail.getPurchasePrice() : BigDecimal.ZERO;
            BigDecimal qty = detail.getQuantity() != null ? detail.getQuantity() : BigDecimal.ZERO;
            BigDecimal cost = purchasePrice.multiply(qty);

            grossSales = grossSales.add(rev);
            grossCost = grossCost.add(cost);

            String prodName = Boolean.TRUE.equals(detail.getIsCompound())
                    ? (detail.getCompoundName() != null ? "[Racikan] " + detail.getCompoundName() : "[Racikan] Obat Racikan")
                    : (detail.getProduct() != null ? detail.getProduct().getName() : "Produk");
            String sku = detail.getProduct() != null && detail.getProduct().getSku() != null
                    ? detail.getProduct().getSku()
                    : (Boolean.TRUE.equals(detail.getIsCompound()) ? "RACIKAN" : "-");
            String key = sku + "::" + prodName;

            ItemBreakdown existing = itemMap.get(key);
            if (existing == null) {
                itemMap.put(key, ItemBreakdown.builder()
                        .productName(prodName)
                        .sku(sku)
                        .quantitySold(qty)
                        .totalRevenue(rev)
                        .totalCost(cost)
                        .grossProfit(rev.subtract(cost))
                        .build());
            } else {
                BigDecimal newQty = existing.getQuantitySold().add(qty);
                BigDecimal newRev = existing.getTotalRevenue().add(rev);
                BigDecimal newCost = existing.getTotalCost().add(cost);
                existing.setQuantitySold(newQty);
                existing.setTotalRevenue(newRev);
                existing.setTotalCost(newCost);
                existing.setGrossProfit(newRev.subtract(newCost));
            }
        }

        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal returnCogs = BigDecimal.ZERO;
        for (SalesReturnDetail rd : returnDetails) {
            BigDecimal refAmt = rd.getRefundAmount() != null ? rd.getRefundAmount() : BigDecimal.ZERO;
            BigDecimal rdQty = rd.getQuantity() != null ? rd.getQuantity() : BigDecimal.ZERO;
            BigDecimal rdPurchasePrice = (rd.getSaleDetail() != null && rd.getSaleDetail().getPurchasePrice() != null)
                    ? rd.getSaleDetail().getPurchasePrice()
                    : BigDecimal.ZERO;
            totalRefunds = totalRefunds.add(refAmt);
            returnCogs = returnCogs.add(rdPurchasePrice.multiply(rdQty));
        }

        BigDecimal totalRevenue = grossSales.subtract(totalRefunds);
        BigDecimal cogs = grossCost.subtract(returnCogs);
        BigDecimal grossProfit = totalRevenue.subtract(cogs);

        List<Expense> expenses = expenseRepository.findExpensesWithFilters(branchId, startDate, endDate);
        BigDecimal totalExpenses = expenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        List<ItemBreakdown> sortedItems = new ArrayList<>(itemMap.values());
        sortedItems.sort((a, b) -> b.getGrossProfit().compareTo(a.getGrossProfit()));

        return ProfitLossReport.builder()
                .grossSales(grossSales)
                .totalRefunds(totalRefunds)
                .totalRevenue(totalRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .totalExpenses(totalExpenses)
                .netProfit(netProfit)
                .expenses(expenses)
                .itemsBreakdown(sortedItems)
                .build();
    }

    @Data
    @Builder
    public static class ItemBreakdown {
        private String productName;
        private String sku;
        private BigDecimal quantitySold;
        private BigDecimal totalRevenue;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
    }

    @Data
    @Builder
    public static class ProfitLossReport {
        private BigDecimal grossSales;
        private BigDecimal totalRefunds;
        private BigDecimal totalRevenue;
        private BigDecimal costOfGoodsSold;
        private BigDecimal grossProfit;
        private BigDecimal totalExpenses;
        private BigDecimal netProfit;
        private List<Expense> expenses;
        private List<ItemBreakdown> itemsBreakdown;
    }
}
