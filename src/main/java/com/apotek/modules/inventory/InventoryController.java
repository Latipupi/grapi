package com.apotek.modules.inventory;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InventoryService inventoryService;

    @GetMapping("/branch/{branchId}")
    public List<Inventory> getInventoryByBranch(@PathVariable Long branchId) {
        return inventoryRepository.findByBranchId(branchId);
    }

    @GetMapping("/branch/{branchId}/batches")
    public List<InventoryBatch> getBatchesByBranch(@PathVariable Long branchId) {
        return inventoryBatchRepository.findByBranchIdOrderByExpiryDateAsc(branchId);
    }

    @GetMapping("/branch/{branchId}/product/{productId}/batches")
    public List<InventoryBatch> getBatchesByProduct(@PathVariable Long branchId, @PathVariable Long productId) {
        return inventoryBatchRepository.findByBranchIdAndProductIdOrderByExpiryDateAsc(branchId, productId);
    }

    @GetMapping("/branch/{branchId}/movements")
    public List<StockMovement> getMovementsByBranch(@PathVariable Long branchId) {
        return stockMovementRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
    }
    
    @GetMapping("/branch/{branchId}/product/{productId}/movements")
    public List<StockMovement> getMovementsByProduct(@PathVariable Long branchId, @PathVariable Long productId) {
        return stockMovementRepository.findByBranchIdAndProductIdOrderByCreatedAtDesc(branchId, productId);
    }

    @PostMapping("/movement")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<StockMovement> recordMovement(@RequestBody MovementRequest request) {
        try {
            StockMovement movement = inventoryService.recordMovement(
                    request.getBranchId(),
                    request.getProductId(),
                    request.getType(),
                    request.getQuantity(),
                    request.getBatchNumber(),
                    request.getExpiryDate(),
                    request.getReferenceNumber(),
                    request.getNotes(),
                    request.getPurchasePrice()
            );
            return ResponseEntity.ok(movement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    public static class MovementRequest {
        private Long branchId;
        private Long productId;
        private String type;
        private BigDecimal quantity;
        private String batchNumber;
        private LocalDate expiryDate;
        private String referenceNumber;
        private String notes;
        private BigDecimal purchasePrice;

        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public BigDecimal getPurchasePrice() { return purchasePrice; }
        public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    }
}
