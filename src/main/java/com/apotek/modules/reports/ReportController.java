package com.apotek.modules.reports;

import com.apotek.modules.sales.Sale;
import com.apotek.modules.sales.SaleDetail;
import com.apotek.modules.sales.SaleDetailRepository;
import com.apotek.modules.sales.SaleRepository;
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

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final SaleRepository saleRepository;
    private final SaleDetailRepository saleDetailRepository;

    @GetMapping("/profit-loss")
    @Transactional(readOnly = true)
    public ProfitLossData getProfitLoss(@RequestParam(required = false) Long branchId, 
                                       @RequestParam(required = false) String startDate,
                                       @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? LocalDate.parse(startDate).atStartOfDay() : LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = endDate != null ? LocalDate.parse(endDate).atTime(23, 59, 59) : LocalDateTime.now();

        List<SaleDetail> details;
        if (branchId != null) {
            details = saleDetailRepository.findBySaleBranchIdAndCreatedAtBetween(branchId, start, end);
        } else {
            details = saleDetailRepository.findByCreatedAtBetween(start, end);
        }

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (SaleDetail detail : details) {
            totalSales = totalSales.add(detail.getSubtotal());
            BigDecimal cost = detail.getPurchasePrice().multiply(detail.getQuantity());
            totalCost = totalCost.add(cost);
        }

        BigDecimal grossProfit = totalSales.subtract(totalCost);
        BigDecimal margin = totalSales.compareTo(BigDecimal.ZERO) > 0 
                ? grossProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        return ProfitLossData.builder()
                .totalSales(totalSales)
                .totalCost(totalCost)
                .grossProfit(grossProfit)
                .marginPercentage(margin)
                .transactionCount(details.stream().map(d -> d.getSale().getId()).distinct().count())
                .build();
    }

    @Data
    @Builder
    public static class ProfitLossData {
        private BigDecimal totalSales;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
        private BigDecimal marginPercentage;
        private long transactionCount;
    }

    @GetMapping("/sales-trend")
    public List<SalesTrendData> getSalesTrend(@RequestParam(required = false) Long branchId) {
        LocalDate last7Days = LocalDate.now().minusDays(7);
        
        List<Sale> sales = saleRepository.findAll().stream()
                .filter(s -> (branchId == null || s.getBranch().getId().equals(branchId))
                        && s.getSaleDate().toLocalDate().isAfter(last7Days))
                .collect(Collectors.toList());

        Map<LocalDate, BigDecimal> groupedSales = sales.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSaleDate().toLocalDate(),
                        Collectors.mapping(Sale::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        List<SalesTrendData> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            trend.add(new SalesTrendData(
                    date.toString(),
                    groupedSales.getOrDefault(date, BigDecimal.ZERO)
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
