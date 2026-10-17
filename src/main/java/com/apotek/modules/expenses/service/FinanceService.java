package com.apotek.modules.expenses.service;
import com.apotek.modules.expenses.model.*;
import com.apotek.modules.expenses.repository.*;

import com.apotek.modules.debt.model.Debt;
import com.apotek.modules.debt.repository.DebtRepository;
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
    private final DebtRepository debtRepository;

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

        List<Debt> unpaidDebts = debtRepository.findAllUnpaidDebts(branchId);
        BigDecimal totalPayableDebt = BigDecimal.ZERO;
        BigDecimal totalReceivableDebt = BigDecimal.ZERO;
        List<DebtBreakdown> debtsList = new ArrayList<>();
        List<DebtBreakdown> receivableDebtsList = new ArrayList<>();

        for (Debt d : unpaidDebts) {
            BigDecimal totalAmt = d.getTotalAmount() != null ? d.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal paidAmt = d.getPaidAmount() != null ? d.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remaining = totalAmt.subtract(paidAmt);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if ("HUTANG_PEMBELIAN".equalsIgnoreCase(d.getType())) {
                totalPayableDebt = totalPayableDebt.add(remaining);
                String invNum = (d.getPurchase() != null && d.getPurchase().getInvoiceNumber() != null && !d.getPurchase().getInvoiceNumber().isBlank())
                        ? d.getPurchase().getInvoiceNumber()
                        : "#PUR-" + (d.getPurchase() != null ? d.getPurchase().getId() : d.getId());
                String suppName = (d.getPurchase() != null && d.getPurchase().getSupplier() != null)
                        ? d.getPurchase().getSupplier().getName()
                        : "Supplier";
                LocalDate pDate = (d.getPurchase() != null && d.getPurchase().getPurchaseDate() != null)
                        ? d.getPurchase().getPurchaseDate()
                        : (d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate() : null);

                debtsList.add(DebtBreakdown.builder()
                        .id(d.getId())
                        .type(d.getType())
                        .invoiceNumber(invNum)
                        .supplierName(suppName)
                        .branchName(d.getBranch() != null ? d.getBranch().getName() : "-")
                        .purchaseDate(pDate)
                        .dueDate(d.getDueDate())
                        .totalAmount(totalAmt)
                        .paidAmount(paidAmt)
                        .remainingAmount(remaining)
                        .status(d.getStatus())
                        .notes(d.getNotes())
                        .build());
            } else if ("HUTANG_PENJUALAN".equalsIgnoreCase(d.getType())) {
                totalReceivableDebt = totalReceivableDebt.add(remaining);
                String invNum = d.getSale() != null ? "#SAL-" + d.getSale().getId() : "#DEBT-" + d.getId();
                String custName = (d.getSale() != null && d.getSale().getCustomer() != null && d.getSale().getCustomer().getName() != null)
                        ? d.getSale().getCustomer().getName()
                        : "Pelanggan Umum";
                LocalDate sDate = (d.getSale() != null && d.getSale().getSaleDate() != null)
                        ? d.getSale().getSaleDate().toLocalDate()
                        : (d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate() : null);

                receivableDebtsList.add(DebtBreakdown.builder()
                        .id(d.getId())
                        .type(d.getType())
                        .invoiceNumber(invNum)
                        .supplierName(custName)
                        .branchName(d.getBranch() != null ? d.getBranch().getName() : "-")
                        .purchaseDate(sDate)
                        .dueDate(d.getDueDate())
                        .totalAmount(totalAmt)
                        .paidAmount(paidAmt)
                        .remainingAmount(remaining)
                        .status(d.getStatus())
                        .notes(d.getNotes())
                        .build());
            }
        }

        BigDecimal totalDeductions = totalExpenses.add(totalPayableDebt).add(totalReceivableDebt);
        BigDecimal netProfit = grossProfit.subtract(totalDeductions);

        List<ItemBreakdown> sortedItems = new ArrayList<>(itemMap.values());
        sortedItems.sort((a, b) -> b.getGrossProfit().compareTo(a.getGrossProfit()));

        return ProfitLossReport.builder()
                .grossSales(grossSales)
                .totalRefunds(totalRefunds)
                .totalRevenue(totalRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .totalExpenses(totalExpenses)
                .totalPayableDebt(totalPayableDebt)
                .totalReceivableDebt(totalReceivableDebt)
                .totalDeductions(totalDeductions)
                .netProfit(netProfit)
                .expenses(expenses)
                .debtsBreakdown(debtsList)
                .receivableDebtsBreakdown(receivableDebtsList)
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
    public static class DebtBreakdown {
        private Long id;
        private String type;
        private String invoiceNumber;
        private String supplierName;
        private String branchName;
        private LocalDate purchaseDate;
        private LocalDate dueDate;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal remainingAmount;
        private String status;
        private String notes;
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
        private BigDecimal totalPayableDebt;
        private BigDecimal totalReceivableDebt;
        private BigDecimal totalDeductions;
        private BigDecimal netProfit;
        private List<Expense> expenses;
        private List<DebtBreakdown> debtsBreakdown;
        private List<DebtBreakdown> receivableDebtsBreakdown;
        private List<ItemBreakdown> itemsBreakdown;
    }
}
