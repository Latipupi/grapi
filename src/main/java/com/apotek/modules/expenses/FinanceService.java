package com.apotek.modules.expenses;

import com.apotek.modules.purchasing.PurchaseRepository;
import com.apotek.modules.sales.Sale;
import com.apotek.modules.sales.SaleRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final SaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseRepository purchaseRepository;

    public ProfitLossReport getProfitLossReport(Long branchId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        // Calculate Revenue (Total Sales)
        List<Sale> sales = saleRepository.findAll().stream()
                .filter(s -> s.getBranch().getId().equals(branchId)
                        && s.getSaleDate().isAfter(start)
                        && s.getSaleDate().isBefore(end)
                        && "COMPLETED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // HPP / COGS (Cost of Goods Sold)
        // For simplicity, we calculate COGS from the purchase price of sold items
        BigDecimal cogs = sales.stream()
                .flatMap(s -> s.getDetails().stream())
                .map(d -> d.getPurchasePrice().multiply(d.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(cogs);

        // Operational Expenses
        List<Expense> expenses = expenseRepository.findByBranchIdAndDateRange(branchId, startDate, endDate);
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        return ProfitLossReport.builder()
                .totalRevenue(totalRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .totalExpenses(totalExpenses)
                .netProfit(netProfit)
                .expenses(expenses)
                .build();
    }

    @Data
    @Builder
    public static class ProfitLossReport {
        private BigDecimal totalRevenue;
        private BigDecimal costOfGoodsSold;
        private BigDecimal grossProfit;
        private BigDecimal totalExpenses;
        private BigDecimal netProfit;
        private List<Expense> expenses;
    }
}
