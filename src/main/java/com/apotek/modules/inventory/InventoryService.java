package com.apotek.modules.inventory;

import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import com.apotek.modules.masterdata.Product;
import com.apotek.modules.masterdata.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;

    @Transactional
    public StockMovement recordMovement(Long branchId, Long productId, String type, BigDecimal quantity,
                                         String batchNumber, LocalDate expiryDate, String referenceNumber, 
                                         String notes, BigDecimal purchasePrice) {
        
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // 1. Update Inventory Summary
        Inventory inventory = inventoryRepository.findByBranchIdAndProductId(branchId, productId)
                .orElse(Inventory.builder()
                        .branch(branch)
                        .product(product)
                        .stockQuantity(BigDecimal.ZERO)
                        .build());

        if ("IN".equalsIgnoreCase(type) || "ADJUSTMENT".equalsIgnoreCase(type)) {
            inventory.setStockQuantity(inventory.getStockQuantity().add(quantity));
        } else if ("OUT".equalsIgnoreCase(type)) {
            inventory.setStockQuantity(inventory.getStockQuantity().subtract(quantity));
        } else {
            throw new IllegalArgumentException("Unknown movement type: " + type);
        }
        inventoryRepository.save(inventory);

        // 2. Update Inventory Batch (Detailed)
        String effectiveBatchNumber = (batchNumber != null && !batchNumber.trim().isEmpty()) ? batchNumber.trim() : "INITIAL";
        InventoryBatch batch = inventoryBatchRepository.findByBranchIdAndProductIdAndBatchNumber(branchId, productId, effectiveBatchNumber)
                .orElse(InventoryBatch.builder()
                        .branch(branch)
                        .product(product)
                        .batchNumber(effectiveBatchNumber)
                        .expiryDate(expiryDate != null ? expiryDate : LocalDate.now().plusYears(1))
                        .currentQuantity(BigDecimal.ZERO)
                        .purchasePrice(purchasePrice != null ? purchasePrice : BigDecimal.ZERO)
                        .build());

        if ("IN".equalsIgnoreCase(type) || "ADJUSTMENT".equalsIgnoreCase(type)) {
            batch.setCurrentQuantity(batch.getCurrentQuantity().add(quantity));
            // Update purchase price if it's an IN movement and we have a price
            if (purchasePrice != null) {
                batch.setPurchasePrice(purchasePrice);
            }
        } else if ("OUT".equalsIgnoreCase(type)) {
            batch.setCurrentQuantity(batch.getCurrentQuantity().subtract(quantity));
        }
        
        // If we are updating an existing batch but provided a new expiry date, update it
        if (expiryDate != null) {
            batch.setExpiryDate(expiryDate);
        }
        
        inventoryBatchRepository.save(batch);

        // 3. Record Stock Movement Log
        StockMovement movement = StockMovement.builder()
                .branch(branch)
                .product(product)
                .type(type.toUpperCase())
                .quantity(quantity)
                .batchNumber(batchNumber)
                .expiryDate(expiryDate)
                .referenceNumber(referenceNumber)
                .notes(notes)
                .purchasePrice(purchasePrice)
                .build();

        return stockMovementRepository.save(movement);
    }
}
