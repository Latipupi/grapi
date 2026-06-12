package com.apotek.modules.purchasing;

import com.apotek.modules.inventory.InventoryService;
import com.apotek.modules.debt.DebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchasingService {

    private final PurchaseRepository purchaseRepository;
    private final InventoryService inventoryService;
    private final DebtService debtService;

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
            debtService.createDebtFromPurchase(saved);
        }

        return saved;
    }

    @Transactional
    public Purchase receivePurchase(Long id, Purchase receiveData) {
        Purchase existing = purchaseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));

        if (!"DRAFT".equalsIgnoreCase(existing.getStatus())) {
            throw new IllegalStateException("Hanya purchase order berstatus DRAFT yang dapat diterima");
        }

        // Update fields if provided
        if (receiveData.getInvoiceNumber() != null && !receiveData.getInvoiceNumber().trim().isEmpty()) {
            existing.setInvoiceNumber(receiveData.getInvoiceNumber().trim());
        }
        if (receiveData.getPaymentMethod() != null) {
            existing.setPaymentMethod(receiveData.getPaymentMethod());
        }
        if (receiveData.getNotes() != null) {
            existing.setNotes(receiveData.getNotes());
        }

        // Update details with confirmed quantities, unit prices, batch numbers, and expiry dates
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        if (receiveData.getDetails() != null) {
            for (PurchaseDetail receivedDetail : receiveData.getDetails()) {
                PurchaseDetail existingDetail = existing.getDetails().stream()
                        .filter(d -> (receivedDetail.getId() != null && d.getId().equals(receivedDetail.getId())) || 
                                     (receivedDetail.getProduct() != null && d.getProduct().getId().equals(receivedDetail.getProduct().getId())))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Detail item tidak ditemukan"));

                if (receivedDetail.getQuantity() != null) {
                    existingDetail.setQuantity(receivedDetail.getQuantity());
                }
                if (receivedDetail.getUnitPrice() != null) {
                    existingDetail.setUnitPrice(receivedDetail.getUnitPrice());
                }
                existingDetail.setBatchNumber(receivedDetail.getBatchNumber());
                existingDetail.setExpiryDate(receivedDetail.getExpiryDate());

                BigDecimal subtotal = existingDetail.getQuantity().multiply(existingDetail.getUnitPrice());
                existingDetail.setSubtotal(subtotal);
                totalAmount = totalAmount.add(subtotal);
            }
        } else {
            for (PurchaseDetail existingDetail : existing.getDetails()) {
                totalAmount = totalAmount.add(existingDetail.getSubtotal());
            }
        }

        existing.setTotalAmount(totalAmount);
        existing.setStatus("RECEIVED");
        if (receiveData.getPurchaseDate() != null) {
            existing.setPurchaseDate(receiveData.getPurchaseDate());
        } else {
            existing.setPurchaseDate(LocalDate.now()); // Fallback to now
        }

        Purchase saved = purchaseRepository.save(existing);

        // Process stock update
        processStockUpdate(saved);

        // Generate accounts payable / debt if credit method
        debtService.createDebtFromPurchase(saved);

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
