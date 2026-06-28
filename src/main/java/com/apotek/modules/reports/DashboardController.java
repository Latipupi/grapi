package com.apotek.modules.reports;

import com.apotek.modules.inventory.InventoryBatchRepository;
import com.apotek.modules.inventory.InventoryRepository;
import com.apotek.modules.sales.SaleRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SaleRepository saleRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final com.apotek.modules.inventory.StockMovementRepository stockMovementRepository;

    @GetMapping("/recent-activities")
    public List<ActivityData> getRecentActivities(@RequestParam(required = false) Long branchId) {
        List<com.apotek.modules.inventory.StockMovement> movements;
        if (branchId != null) {
            movements = stockMovementRepository.findTop10ByBranchIdOrderByCreatedAtDesc(branchId);
        } else {
            movements = stockMovementRepository.findTop10ByOrderByCreatedAtDesc();
        }

        return movements.stream().map(m -> ActivityData.builder()
                .type(m.getType())
                .productName(m.getProduct().getName())
                .quantity(m.getQuantity())
                .branchName(m.getBranch().getName())
                .createdAt(m.getCreatedAt())
                .notes(m.getNotes())
                .build())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    public static class ActivityData {
        private String type;
        private String productName;
        private BigDecimal quantity;
        private String branchName;
        private LocalDateTime createdAt;
        private String notes;
    }

    @GetMapping("/stats")
    public DashboardStats getStats(@RequestParam(required = false) Long branchId) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal totalSalesToday = saleRepository.sumSalesByBranchAndDateBetween(branchId, startOfDay, endOfDay);
        long transactionsToday = saleRepository.countSalesByBranchAndDateBetween(branchId, startOfDay, endOfDay);

        LocalDate ninetyDaysFromNow = LocalDate.now().plusDays(90);
        long expiredCount = inventoryBatchRepository.countExpiredBatches(branchId, ninetyDaysFromNow);

        long lowStockCount = inventoryRepository.countLowStockItems(branchId);

        return DashboardStats.builder()
                .totalSalesToday(totalSalesToday)
                .transactionsToday(transactionsToday)
                .expiredProductsCount(expiredCount)
                .lowStockProductsCount(lowStockCount)
                .build();
    }

    @GetMapping("/alerts")
    public DashboardAlerts getAlerts(@RequestParam(required = false) Long branchId) {
        LocalDate ninetyDaysFromNow = LocalDate.now().plusDays(90);

        List<com.apotek.modules.inventory.InventoryBatch> expiringBatches = 
                inventoryBatchRepository.findExpiringBatches(branchId, ninetyDaysFromNow);

        List<com.apotek.modules.inventory.Inventory> lowStockItems = 
                inventoryRepository.findLowStockItems(branchId);

        return DashboardAlerts.builder()
                .expiringBatches(expiringBatches)
                .lowStockItems(lowStockItems)
                .build();
    }

    @Data
    @Builder
    public static class DashboardAlerts {
        private List<com.apotek.modules.inventory.InventoryBatch> expiringBatches;
        private List<com.apotek.modules.inventory.Inventory> lowStockItems;
    }

    public static class DashboardStats {
        private BigDecimal totalSalesToday;
        private long transactionsToday;
        private long expiredProductsCount;
        private long lowStockProductsCount;

        public BigDecimal getTotalSalesToday() { return totalSalesToday; }
        public void setTotalSalesToday(BigDecimal totalSalesToday) { this.totalSalesToday = totalSalesToday; }
        public long getTransactionsToday() { return transactionsToday; }
        public void setTransactionsToday(long transactionsToday) { this.transactionsToday = transactionsToday; }
        public long getExpiredProductsCount() { return expiredProductsCount; }
        public void setExpiredProductsCount(long expiredCount) { this.expiredProductsCount = expiredCount; }
        public long getLowStockProductsCount() { return lowStockProductsCount; }
        public void setLowStockProductsCount(long lowStockCount) { this.lowStockProductsCount = lowStockCount; }

        public static DashboardStatsBuilder builder() { return new DashboardStatsBuilder(); }

        public static class DashboardStatsBuilder {
            private BigDecimal totalSalesToday;
            private long transactionsToday;
            private long expiredCount;
            private long lowStockCount;
            public DashboardStatsBuilder totalSalesToday(BigDecimal total) { this.totalSalesToday = total; return this; }
            public DashboardStatsBuilder transactionsToday(long count) { this.transactionsToday = count; return this; }
            public DashboardStatsBuilder expiredProductsCount(long count) { this.expiredCount = count; return this; }
            public DashboardStatsBuilder lowStockProductsCount(long count) { this.lowStockCount = count; return this; }
            public DashboardStats build() {
                DashboardStats stats = new DashboardStats();
                stats.setTotalSalesToday(totalSalesToday);
                stats.setTransactionsToday(transactionsToday);
                stats.setExpiredProductsCount(expiredCount);
                stats.setLowStockProductsCount(lowStockCount);
                return stats;
            }
        }
    }
}
