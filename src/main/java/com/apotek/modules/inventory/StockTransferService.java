package com.apotek.modules.inventory;

import com.apotek.modules.auth.User;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import com.apotek.modules.masterdata.Product;
import com.apotek.modules.masterdata.ProductRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockTransferService {

    private final StockTransferRepository stockTransferRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryService inventoryService;

    @Transactional
    public StockTransfer createTransfer(StockTransferRequest request, User currentUser) {
        if (request.getSourceBranchId().equals(request.getDestinationBranchId())) {
            throw new IllegalArgumentException("Cabang asal dan tujuan tidak boleh sama");
        }

        Branch sourceBranch = branchRepository.findById(request.getSourceBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Cabang asal tidak ditemukan"));
        
        Branch destinationBranch = branchRepository.findById(request.getDestinationBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Cabang tujuan tidak ditemukan"));

        // 1. Initialize Stock Transfer Document
        StockTransfer transfer = StockTransfer.builder()
                .sourceBranch(sourceBranch)
                .destinationBranch(destinationBranch)
                .user(currentUser)
                .status("COMPLETED")
                .notes(request.getNotes())
                .details(new java.util.LinkedHashSet<>())
                .build();

        // 2. Save document first to generate ID for Reference
        transfer = stockTransferRepository.save(transfer);
        String refNumber = "TRF-" + String.format("%06d", transfer.getId());

        // 3. Process transfer items
        for (TransferItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Produk tidak ditemukan"));

            // Get purchase price from source batch for financial accuracy
            BigDecimal purchasePrice = BigDecimal.ZERO;
            if (itemRequest.getBatchNumber() != null && !itemRequest.getBatchNumber().isEmpty()) {
                var sourceBatchOpt = inventoryBatchRepository.findByBranchIdAndProductIdAndBatchNumber(
                        request.getSourceBranchId(), itemRequest.getProductId(), itemRequest.getBatchNumber());
                
                if (sourceBatchOpt.isPresent()) {
                    purchasePrice = sourceBatchOpt.get().getPurchasePrice();
                    
                    // Verify sufficient quantity in source batch
                    if (sourceBatchOpt.get().getCurrentQuantity().compareTo(itemRequest.getQuantity()) < 0) {
                        throw new IllegalArgumentException("Stok Batch '" + itemRequest.getBatchNumber() + 
                                "' di cabang " + sourceBranch.getName() + " tidak mencukupi untuk ditransfer");
                    }
                } else {
                    throw new IllegalArgumentException("Batch '" + itemRequest.getBatchNumber() + "' tidak ditemukan di cabang asal");
                }
            }

            // A. Deduct from source branch (TRANSFER_OUT)
            inventoryService.recordMovement(
                    request.getSourceBranchId(),
                    itemRequest.getProductId(),
                    "OUT",
                    itemRequest.getQuantity(),
                    itemRequest.getBatchNumber(),
                    itemRequest.getExpiryDate(),
                    refNumber,
                    "Ditransfer ke cabang: " + destinationBranch.getName(),
                    purchasePrice
            );

            // B. Add to destination branch (TRANSFER_IN)
            inventoryService.recordMovement(
                    request.getDestinationBranchId(),
                    itemRequest.getProductId(),
                    "IN",
                    itemRequest.getQuantity(),
                    itemRequest.getBatchNumber(),
                    itemRequest.getExpiryDate(),
                    refNumber,
                    "Diterima dari cabang: " + sourceBranch.getName(),
                    purchasePrice
            );

            // C. Create transfer detail record
            StockTransferDetail detail = StockTransferDetail.builder()
                    .stockTransfer(transfer)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .batchNumber(itemRequest.getBatchNumber())
                    .expiryDate(itemRequest.getExpiryDate())
                    .build();

            transfer.addDetail(detail);
        }

        // 4. Save final state
        return stockTransferRepository.save(transfer);
    }

    @Data
    public static class StockTransferRequest {
        private Long sourceBranchId;
        private Long destinationBranchId;
        private String notes;
        private List<TransferItemRequest> items;
    }

    @Data
    public static class TransferItemRequest {
        private Long productId;
        private BigDecimal quantity;
        private String batchNumber;
        private LocalDate expiryDate;
    }
}
