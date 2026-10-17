package com.apotek.modules.reports.controller;

import com.apotek.modules.sales.model.Sale;
import com.apotek.modules.sales.model.SaleDetail;
import com.apotek.modules.sales.repository.SaleDetailRepository;
import com.apotek.modules.sales.repository.SaleRepository;
import com.apotek.modules.sales.model.SalesReturn;
import com.apotek.modules.sales.repository.SalesReturnRepository;
import com.apotek.modules.sales.model.SalesReturnDetail;
import com.apotek.modules.sales.repository.SalesReturnDetailRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

import com.apotek.modules.debt.model.Debt;
import com.apotek.modules.debt.repository.DebtRepository;
import com.apotek.modules.expenses.model.Expense;
import com.apotek.modules.expenses.repository.ExpenseRepository;
import com.apotek.modules.masterdata.dto.CustomerLoyaltyReportDTO;
import com.apotek.modules.masterdata.model.Branch;
import com.apotek.modules.masterdata.repository.BranchRepository;
import com.apotek.modules.masterdata.service.CustomerService;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final SaleRepository saleRepository;
    private final SaleDetailRepository saleDetailRepository;
    private final BranchRepository branchRepository;
    private final SalesReturnRepository salesReturnRepository;
    private final SalesReturnDetailRepository salesReturnDetailRepository;
    private final ExpenseRepository expenseRepository;
    private final DebtRepository debtRepository;
    private final CustomerService customerService;

    @GetMapping("/customer-loyalty")
    @Transactional(readOnly = true)
    public CustomerLoyaltyReportDTO getCustomerLoyalty(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "TOTAL_SPENT") String sortBy,
            @RequestParam(required = false, defaultValue = "false") Boolean includeAll
    ) {
        return customerService.getCustomerLoyaltyReport(branchId, startDate, endDate, sortBy, includeAll);
    }

    @Data
    @Builder
    public static class ItemProfitBreakdown {
        private String productName;
        private String sku;
        private BigDecimal quantitySold;
        private BigDecimal totalRevenue;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
    }

    @Data
    @Builder
    public static class ReturnBreakdown {
        private Long returnId;
        private LocalDateTime returnDate;
        private String productName;
        private BigDecimal quantity;
        private BigDecimal refundAmount;
        private BigDecimal returnCost;
    }

    @Data
    @Builder
    public static class ExpenseBreakdown {
        private Long id;
        private LocalDate expenseDate;
        private String branchName;
        private String category;
        private String expenseType;
        private String notes;
        private BigDecimal amount;
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
    public static class BranchComparisonData {
        private Long branchId;
        private String branchName;
        private BigDecimal grossSales;
        private BigDecimal totalRefunds;
        private BigDecimal totalSales;
        private BigDecimal grossCost;
        private BigDecimal totalReturnCost;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
        private BigDecimal totalExpenses;
        private BigDecimal totalPayableDebt;
        private BigDecimal totalReceivableDebt;
        private BigDecimal totalDeductions;
        private BigDecimal netProfit;
        private BigDecimal marginPercentage;
        private BigDecimal netMarginPercentage;
        private long transactionCount;
        private List<ItemProfitBreakdown> itemsBreakdown;
        private List<ReturnBreakdown> returnsBreakdown;
        private List<ExpenseBreakdown> expensesBreakdown;
        private List<DebtBreakdown> debtsBreakdown;
        private List<DebtBreakdown> receivableDebtsBreakdown;
    }

    @GetMapping("/branch-comparison")
    @Transactional(readOnly = true)
    public List<BranchComparisonData> getBranchComparison(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        LocalDate startLd = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate)
                : LocalDate.of(2000, 1, 1);
        LocalDate endLd = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate)
                : LocalDate.now();

        List<Branch> branches = branchRepository.findAll();
        List<BranchComparisonData> comparison = new ArrayList<>();

        for (Branch branch : branches) {
            comparison.add(buildBranchProfitLoss(branch.getId(), branch.getName(), startLd, endLd));
        }

        return comparison;
    }

    @GetMapping("/profit-loss")
    @Transactional(readOnly = true)
    public ProfitLossData getProfitLoss(@RequestParam(required = false) Long branchId, 
                                       @RequestParam(required = false) String startDate,
                                       @RequestParam(required = false) String endDate) {
        if (branchId != null && branchId <= 0) {
            branchId = null;
        }
        LocalDate startLd = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate)
                : LocalDate.of(2000, 1, 1);
        LocalDate endLd = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate)
                : LocalDate.now();

        String branchName = "Semua Cabang";
        if (branchId != null) {
            branchName = branchRepository.findById(branchId).map(Branch::getName).orElse("Cabang");
        }

        BranchComparisonData data = buildBranchProfitLoss(branchId, branchName, startLd, endLd);

        return ProfitLossData.builder()
                .branchId(data.getBranchId())
                .branchName(data.getBranchName())
                .grossSales(data.getGrossSales())
                .totalRefunds(data.getTotalRefunds())
                .totalSales(data.getTotalSales())
                .grossCost(data.getGrossCost())
                .totalReturnCost(data.getTotalReturnCost())
                .totalCost(data.getTotalCost())
                .grossProfit(data.getGrossProfit())
                .totalExpenses(data.getTotalExpenses())
                .totalPayableDebt(data.getTotalPayableDebt())
                .totalReceivableDebt(data.getTotalReceivableDebt())
                .totalDeductions(data.getTotalDeductions())
                .netProfit(data.getNetProfit())
                .marginPercentage(data.getMarginPercentage())
                .netMarginPercentage(data.getNetMarginPercentage())
                .transactionCount(data.getTransactionCount())
                .itemsBreakdown(data.getItemsBreakdown())
                .returnsBreakdown(data.getReturnsBreakdown())
                .expensesBreakdown(data.getExpensesBreakdown())
                .debtsBreakdown(data.getDebtsBreakdown())
                .receivableDebtsBreakdown(data.getReceivableDebtsBreakdown())
                .build();
    }

    private BranchComparisonData buildBranchProfitLoss(Long branchId, String branchName, LocalDate startLd, LocalDate endLd) {
        LocalDateTime start = startLd.atStartOfDay();
        LocalDateTime end = endLd.atTime(23, 59, 59, 999999999);

        List<SaleDetail> details = saleDetailRepository.findCompletedByBranchAndSaleDateBetween(branchId, start, end);
        List<SalesReturnDetail> returnDetails = salesReturnDetailRepository.findByBranchIdAndCreatedAtBetween(branchId, start, end);
        List<Expense> expenses = expenseRepository.findExpensesWithFilters(branchId, startLd, endLd);
        List<Debt> unpaidDebts = debtRepository.findAllUnpaidDebts(branchId);

        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal grossCost = BigDecimal.ZERO;

        Map<String, ItemProfitBreakdown> itemMap = new LinkedHashMap<>();

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

            ItemProfitBreakdown existing = itemMap.get(key);
            if (existing == null) {
                itemMap.put(key, ItemProfitBreakdown.builder()
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
        BigDecimal totalReturnCost = BigDecimal.ZERO;
        List<ReturnBreakdown> returnsList = new ArrayList<>();

        for (SalesReturnDetail rd : returnDetails) {
            BigDecimal refAmt = rd.getRefundAmount() != null ? rd.getRefundAmount() : BigDecimal.ZERO;
            BigDecimal rdQty = rd.getQuantity() != null ? rd.getQuantity() : BigDecimal.ZERO;
            BigDecimal rdPurchasePrice = (rd.getSaleDetail() != null && rd.getSaleDetail().getPurchasePrice() != null)
                    ? rd.getSaleDetail().getPurchasePrice()
                    : BigDecimal.ZERO;
            BigDecimal cost = rdPurchasePrice.multiply(rdQty);

            totalRefunds = totalRefunds.add(refAmt);
            totalReturnCost = totalReturnCost.add(cost);

            String prodName = (rd.getSaleDetail() != null && rd.getSaleDetail().getProduct() != null)
                    ? rd.getSaleDetail().getProduct().getName()
                    : "Retur Produk";

            returnsList.add(ReturnBreakdown.builder()
                    .returnId(rd.getSalesReturn() != null ? rd.getSalesReturn().getId() : rd.getId())
                    .returnDate(rd.getCreatedAt())
                    .productName(prodName)
                    .quantity(rdQty)
                    .refundAmount(refAmt)
                    .returnCost(cost)
                    .build());
        }

        BigDecimal totalSales = grossSales.subtract(totalRefunds);
        BigDecimal totalCost = grossCost.subtract(totalReturnCost);
        BigDecimal grossProfit = totalSales.subtract(totalCost);

        BigDecimal totalExpenses = BigDecimal.ZERO;
        List<ExpenseBreakdown> expensesList = new ArrayList<>();
        for (Expense exp : expenses) {
            BigDecimal amt = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
            totalExpenses = totalExpenses.add(amt);
            expensesList.add(ExpenseBreakdown.builder()
                    .id(exp.getId())
                    .expenseDate(exp.getExpenseDate())
                    .branchName(exp.getBranch() != null ? exp.getBranch().getName() : branchName)
                    .category(exp.getCategory())
                    .expenseType(exp.getExpenseType())
                    .notes(exp.getNotes())
                    .amount(amt)
                    .build());
        }

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
                        .branchName(d.getBranch() != null ? d.getBranch().getName() : branchName)
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
                        .branchName(d.getBranch() != null ? d.getBranch().getName() : branchName)
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

        BigDecimal margin = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                : BigDecimal.ZERO;
        BigDecimal netMargin = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        List<ItemProfitBreakdown> sortedItems = new ArrayList<>(itemMap.values());
        sortedItems.sort((a, b) -> b.getGrossProfit().compareTo(a.getGrossProfit()));

        return BranchComparisonData.builder()
                .branchId(branchId)
                .branchName(branchName)
                .grossSales(grossSales)
                .totalRefunds(totalRefunds)
                .totalSales(totalSales)
                .grossCost(grossCost)
                .totalReturnCost(totalReturnCost)
                .totalCost(totalCost)
                .grossProfit(grossProfit)
                .totalExpenses(totalExpenses)
                .totalPayableDebt(totalPayableDebt)
                .totalReceivableDebt(totalReceivableDebt)
                .totalDeductions(totalDeductions)
                .netProfit(netProfit)
                .marginPercentage(margin)
                .netMarginPercentage(netMargin)
                .transactionCount(details.stream().map(d -> d.getSale().getId()).distinct().count())
                .itemsBreakdown(sortedItems)
                .returnsBreakdown(returnsList)
                .expensesBreakdown(expensesList)
                .debtsBreakdown(debtsList)
                .receivableDebtsBreakdown(receivableDebtsList)
                .build();
    }

    @Data
    @Builder
    public static class ProfitLossData {
        private Long branchId;
        private String branchName;
        private BigDecimal grossSales;
        private BigDecimal totalRefunds;
        private BigDecimal totalSales;
        private BigDecimal grossCost;
        private BigDecimal totalReturnCost;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
        private BigDecimal totalExpenses;
        private BigDecimal totalPayableDebt;
        private BigDecimal totalReceivableDebt;
        private BigDecimal totalDeductions;
        private BigDecimal netProfit;
        private BigDecimal marginPercentage;
        private BigDecimal netMarginPercentage;
        private long transactionCount;
        private List<ItemProfitBreakdown> itemsBreakdown;
        private List<ReturnBreakdown> returnsBreakdown;
        private List<ExpenseBreakdown> expensesBreakdown;
        private List<DebtBreakdown> debtsBreakdown;
        private List<DebtBreakdown> receivableDebtsBreakdown;
    }

    @GetMapping("/sales-trend")
    public List<SalesTrendData> getSalesTrend(@RequestParam(required = false) Long branchId) {
        if (branchId != null && branchId <= 0) {
            branchId = null;
        }
        LocalDate last7Days = LocalDate.now().minusDays(7);
        LocalDateTime thresholdDateTime = last7Days.plusDays(1).atStartOfDay();
        
        List<Sale> sales = saleRepository.findByBranchIdAndSaleDateAfter(branchId, thresholdDateTime);
        List<SalesReturn> returns = salesReturnRepository.findByBranchIdAndReturnDateAfter(branchId, thresholdDateTime);

        Map<LocalDate, BigDecimal> groupedSales = sales.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSaleDate().toLocalDate(),
                        Collectors.mapping(Sale::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        Map<LocalDate, BigDecimal> groupedRefunds = returns.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getReturnDate().toLocalDate(),
                        Collectors.mapping(SalesReturn::getTotalRefundAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        List<SalesTrendData> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            BigDecimal grossSale = groupedSales.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal refund = groupedRefunds.getOrDefault(date, BigDecimal.ZERO);
            trend.add(new SalesTrendData(
                    date.toString(),
                    grossSale.subtract(refund)
            ));
        }

        return trend;
    }

    public static class SalesTrendData {
        private String date;
        private BigDecimal total;

        public SalesTrendData(String date, BigDecimal total) {
            this.date = date;
            this.total = total;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public BigDecimal getTotal() { return total; }
        public void setTotal(BigDecimal total) { this.total = total; }
    }
}
