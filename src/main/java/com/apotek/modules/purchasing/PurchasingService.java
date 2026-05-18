package com.apotek.modules.purchasing;

import com.apotek.modules.inventory.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchasingService {

    private final PurchaseRepository purchaseRepository;
    private final InventoryService inventoryService;

    public List<Purchase> getAll() {
        return purchaseRepository.findAll();
    }

    public List<Purchase> getByBranch(Long branchId) {
        return purchaseRepository.findByBranchIdOrderByPurchaseDateDesc(branchId);
    }

    public Purchase getById(Long id) {
        return purchaseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));
    }

    @Transactional
    public Purchase createPurchase(Purchase purchase) {
        // Initial status is usually RECEIVED for MVP simplicity (Auto-Stock)
        // or DRAFT if we want a multi-step process.
        // User said "logic penambahan stok saat barang diterima".
        
        purchase.getDetails().forEach(detail -> {
            detail.setPurchase(purchase);
            if (detail.getSubtotal() == null) {
                detail.setSubtotal(detail.getQuantity().multiply(detail.getUnitPrice()));
            }
        });

        Purchase saved = purchaseRepository.save(purchase);

        if ("RECEIVED".equalsIgnoreCase(saved.getStatus())) {
            processStockUpdate(saved);
        }

        return saved;
    }

    @Transactional
    public void processStockUpdate(Purchase purchase) {
        for (PurchaseDetail detail : purchase.getDetails()) {
            inventoryService.recordMovement(
                    purchase.getBranch().getId(),
                    detail.getProduct().getId(),
                    "IN",
                    detail.getQuantity(),
                    detail.getBatchNumber(),
                    detail.getExpiryDate(),
                    purchase.getInvoiceNumber() != null ? purchase.getInvoiceNumber() : "PO-" + purchase.getId(),
                    "Purchase from " + purchase.getSupplier().getName(),
                    detail.getUnitPrice()
            );
        }
    }
}
