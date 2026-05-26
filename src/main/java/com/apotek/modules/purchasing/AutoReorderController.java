package com.apotek.modules.purchasing;

import com.apotek.core.security.TenantContext;
import com.apotek.modules.inventory.Inventory;
import com.apotek.modules.inventory.InventoryBatch;
import com.apotek.modules.inventory.InventoryBatchRepository;
import com.apotek.modules.inventory.InventoryRepository;
import com.apotek.modules.masterdata.*;
import com.apotek.modules.sales.SaleDetail;
import com.apotek.modules.sales.SaleDetailRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/purchasing/auto-reorder")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF')")
public class AutoReorderController {

    private final InventoryRepository inventoryRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final SaleDetailRepository saleDetailRepository;
    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final PurchasingService purchasingService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<SupplierGroupDto>> getRecommendations() {
        String tenantId = TenantContext.getCurrentTenant();
        
        // 1. Fetch sales details in last 30 days to calculate average daily sales (sales velocity)
        LocalDateTime start30DaysAgo = LocalDateTime.now().minusDays(30);
        LocalDateTime now = LocalDateTime.now();
        List<SaleDetail> sales30Days = saleDetailRepository.findByCreatedAtBetween(start30DaysAgo, now);

        // Sum quantities sold per product
        Map<Long, BigDecimal> productSalesSum = new HashMap<>();
        for (SaleDetail detail : sales30Days) {
            if (detail.getProduct() != null) {
                Long productId = detail.getProduct().getId();
                BigDecimal qty = detail.getQuantity() != null ? detail.getQuantity() : BigDecimal.ZERO;
                productSalesSum.put(productId, productSalesSum.getOrDefault(productId, BigDecimal.ZERO).add(qty));
            }
        }

        // 2. Fetch all inventory items (automatically filtered by tenantId via Hibernate Filter)
        List<Inventory> inventories = inventoryRepository.findAll();
        
        // Map to hold recommendations grouped by Supplier
        Map<Supplier, List<ReorderItemDto>> groupedRecommendations = new HashMap<>();
        List<ReorderItemDto> unmappedSupplierItems = new ArrayList<>();

        for (Inventory item : inventories) {
            Product product = item.getProduct();
            if (product == null) continue;

            BigDecimal currentStock = item.getStockQuantity() != null ? item.getStockQuantity() : BigDecimal.ZERO;
            BigDecimal minimumStock = item.getMinimumStock() != null ? item.getMinimumStock() : new BigDecimal("10.0");

            // Calculate sales velocity (avg daily sales)
            BigDecimal totalSales30Days = productSalesSum.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal avgDailySales = totalSales30Days.divide(new BigDecimal("30"), 2, RoundingMode.HALF_UP);

            // Reorder Point (ROP) = (avgDailySales * 3 days lead time) + minimumStock
            BigDecimal leadTimeDays = new BigDecimal("3");
            BigDecimal reorderPoint = avgDailySales.multiply(leadTimeDays).add(minimumStock);

            // If current stock is less than or equal to ROP, recommend reordering!
            if (currentStock.compareTo(reorderPoint) <= 0) {
                ReorderItemDto dto = new ReorderItemDto();
                dto.setProductId(product.getId());
                dto.setProductName(product.getName());
                dto.setSku(product.getSku());
                dto.setBranchId(item.getBranch().getId());
                dto.setBranchName(item.getBranch().getName());
                dto.setCurrentStock(currentStock);
                dto.setMinimumStock(minimumStock);
                dto.setAvgDailySales(avgDailySales);
                dto.setReorderPoint(reorderPoint);

                // Calculate Suggested Quantity: enough for 30 days + minimumStock - currentStock
                BigDecimal targetQty = avgDailySales.multiply(new BigDecimal("30")).add(minimumStock);
                BigDecimal suggestedQty = targetQty.subtract(currentStock);
                
                // If suggested quantity is negative or less than minimum stock, default to minimumStock * 2
                if (suggestedQty.compareTo(BigDecimal.ZERO) <= 0 || avgDailySales.compareTo(BigDecimal.ZERO) == 0) {
                    suggestedQty = minimumStock.multiply(new BigDecimal("2"));
                }
                // Round up suggested quantity to whole number
                dto.setSuggestedQuantity(suggestedQty.setScale(0, RoundingMode.CEILING));

                // Fetch latest purchase price from existing batches with smart fallback
                BigDecimal lastPurchasePrice = getLatestPurchasePrice(product);
                dto.setLastPurchasePrice(lastPurchasePrice);
                dto.setSellingPrice(product.getSellingPrice() != null ? product.getSellingPrice() : BigDecimal.ZERO);

                Supplier supplier = product.getSupplier();
                if (supplier != null) {
                    groupedRecommendations.computeIfAbsent(supplier, k -> new ArrayList<>()).add(dto);
                } else {
                    unmappedSupplierItems.add(dto);
                }
            }
        }

        // Convert grouped map to DTO list
        List<SupplierGroupDto> result = new ArrayList<>();
        
        for (Map.Entry<Supplier, List<ReorderItemDto>> entry : groupedRecommendations.entrySet()) {
            Supplier supplier = entry.getKey();
            SupplierGroupDto groupDto = new SupplierGroupDto();
            groupDto.setSupplierId(supplier.getId());
            groupDto.setSupplierName(supplier.getName());
            groupDto.setSupplierPhone(supplier.getPhone());
            groupDto.setItems(entry.getValue());
            result.add(groupDto);
        }

        // Add group for items without supplier so user can see them
        if (!unmappedSupplierItems.isEmpty()) {
            SupplierGroupDto unmappedGroup = new SupplierGroupDto();
            unmappedGroup.setSupplierId(0L);
            unmappedGroup.setSupplierName("Belum Ada Supplier");
            unmappedGroup.setSupplierPhone("");
            unmappedGroup.setItems(unmappedSupplierItems);
            result.add(unmappedGroup);
        }

        // Sort by supplier name
        result.sort(Comparator.comparing(SupplierGroupDto::getSupplierName));

        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate-pos")
    @Transactional
    public ResponseEntity<Map<String, Object>> generateDraftPOs(@RequestBody List<SupplierGroupDto> recommendations) {
        String tenantId = TenantContext.getCurrentTenant();
        int poCount = 0;
        List<Long> generatedPoIds = new ArrayList<>();

        for (SupplierGroupDto group : recommendations) {
            // Skip "Belum Ada Supplier" or empty items
            if (group.getSupplierId() == null || group.getSupplierId() <= 0 || group.getItems() == null || group.getItems().isEmpty()) {
                continue;
            }

            // Group items by Branch so we create separate POs per branch
            Map<Long, List<ReorderItemDto>> itemsByBranch = group.getItems().stream()
                    .collect(Collectors.groupingBy(ReorderItemDto::getBranchId));

            for (Map.Entry<Long, List<ReorderItemDto>> branchEntry : itemsByBranch.entrySet()) {
                Long branchId = branchEntry.getKey();
                List<ReorderItemDto> branchItems = branchEntry.getValue();

                Purchase purchase = new Purchase();
                
                // Set Supplier
                Supplier supplier = supplierRepository.findById(group.getSupplierId()).orElse(null);
                if (supplier == null) continue;
                purchase.setSupplier(supplier);

                // Set Branch
                Branch branch = branchRepository.findById(branchId).orElse(null);
                if (branch == null) continue;
                purchase.setBranch(branch);

                purchase.setPurchaseDate(LocalDate.now());
                purchase.setInvoiceNumber("AUTO-PO-" + System.currentTimeMillis() / 1000 + "-" + branchId);
                purchase.setStatus("DRAFT");
                purchase.setPaymentMethod("CASH");
                purchase.setTenantId(tenantId);
                purchase.setNotes("Generated otomatis oleh Auto-Reorder System.");

                BigDecimal totalAmount = BigDecimal.ZERO;

                for (ReorderItemDto item : branchItems) {
                    PurchaseDetail detail = new PurchaseDetail();
                    
                    Product product = productRepository.findById(item.getProductId()).orElse(null);
                    if (product == null) continue;
                    
                    detail.setProduct(product);
                    detail.setQuantity(item.getSuggestedQuantity());
                    detail.setUnitPrice(item.getLastPurchasePrice());
                    
                    BigDecimal subtotal = item.getSuggestedQuantity().multiply(item.getLastPurchasePrice());
                    detail.setSubtotal(subtotal);
                    
                    totalAmount = totalAmount.add(subtotal);
                    purchase.addDetail(detail);
                }

                purchase.setTotalAmount(totalAmount);
                Purchase saved = purchasingService.createPurchase(purchase);
                generatedPoIds.add(saved.getId());
                poCount++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Berhasil membuat " + poCount + " draf Surat Pesanan (PO).");
        response.put("generatedPoIds", generatedPoIds);

        return ResponseEntity.ok(response);
    }

    private BigDecimal getLatestPurchasePrice(Product product) {
        // Query historical price
        BigDecimal historicalPrice = inventoryBatchRepository.findAll().stream()
                .filter(b -> b.getProduct() != null && b.getProduct().getId().equals(product.getId()) && b.getPurchasePrice() != null)
                .sorted((b1, b2) -> b2.getId().compareTo(b1.getId()))
                .map(InventoryBatch::getPurchasePrice)
                .findFirst()
                .orElse(BigDecimal.ZERO);
                
        // Fallback: If no historical price is found, use 80% of selling price as estimate cost
        if (historicalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal sellingPrice = product.getSellingPrice();
            if (sellingPrice != null && sellingPrice.compareTo(BigDecimal.ZERO) > 0) {
                return sellingPrice.multiply(new BigDecimal("0.8")).setScale(0, RoundingMode.HALF_UP);
            }
        }
        return historicalPrice;
    }

    @Data
    public static class SupplierGroupDto {
        private Long supplierId;
        private String supplierName;
        private String supplierPhone;
        private List<ReorderItemDto> items;
    }

    @Data
    public static class ReorderItemDto {
        private Long productId;
        private String productName;
        private String sku;
        private Long branchId;
        private String branchName;
        private BigDecimal currentStock;
        private BigDecimal minimumStock;
        private BigDecimal avgDailySales;
        private BigDecimal reorderPoint;
        private BigDecimal suggestedQuantity;
        private BigDecimal lastPurchasePrice;
        private BigDecimal sellingPrice;
    }
}
