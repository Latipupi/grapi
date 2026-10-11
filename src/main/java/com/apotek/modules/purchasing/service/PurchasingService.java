package com.apotek.modules.purchasing.service;
import com.apotek.modules.purchasing.model.*;
import com.apotek.modules.purchasing.repository.*;

import com.apotek.modules.inventory.service.InventoryService;
import com.apotek.modules.debt.service.DebtService;
import com.apotek.modules.masterdata.model.Product;
import com.apotek.modules.masterdata.repository.ProductRepository;
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
    private final ProductRepository productRepository;

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
        calculateAndNormalizePricing(purchase);

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
        if (receiveData.getDiscountPercent() != null) {
            existing.setDiscountPercent(receiveData.getDiscountPercent());
        }
        if (receiveData.getDiscountAmount() != null) {
            existing.setDiscountAmount(receiveData.getDiscountAmount());
        }

        // Update details with confirmed quantities, unit prices, discounts, batch numbers, and expiry dates
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
                existingDetail.setDiscountPercent(receivedDetail.getDiscountPercent());
                existingDetail.setDiscountAmount(receivedDetail.getDiscountAmount());
                existingDetail.setBatchNumber(receivedDetail.getBatchNumber());
                existingDetail.setExpiryDate(receivedDetail.getExpiryDate());
            }
        }

        calculateAndNormalizePricing(existing);

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

    public void calculateAndNormalizePricing(Purchase purchase) {
        BigDecimal sumItemsSubtotal = BigDecimal.ZERO;

        if (purchase.getDetails() != null) {
            for (PurchaseDetail detail : purchase.getDetails()) {
                detail.setPurchase(purchase);

                BigDecimal qty = detail.getQuantity() != null ? detail.getQuantity() : BigDecimal.ZERO;
                BigDecimal price = detail.getUnitPrice() != null ? detail.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal gross = qty.multiply(price);

                BigDecimal discPercent = detail.getDiscountPercent() != null ? detail.getDiscountPercent() : BigDecimal.ZERO;
                BigDecimal discAmount = detail.getDiscountAmount() != null ? detail.getDiscountAmount() : BigDecimal.ZERO;

                if (discPercent.compareTo(BigDecimal.ZERO) > 0) {
                    discAmount = gross.multiply(discPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    detail.setDiscountAmount(discAmount);
                } else if (discAmount.compareTo(BigDecimal.ZERO) > 0 && gross.compareTo(BigDecimal.ZERO) > 0) {
                    discPercent = discAmount.divide(gross, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, java.math.RoundingMode.HALF_UP);
                    detail.setDiscountPercent(discPercent);
                } else {
                    detail.setDiscountPercent(BigDecimal.ZERO);
                    detail.setDiscountAmount(BigDecimal.ZERO);
                }

                BigDecimal itemSubtotal = gross.subtract(detail.getDiscountAmount());
                if (itemSubtotal.compareTo(BigDecimal.ZERO) < 0) {
                    itemSubtotal = BigDecimal.ZERO;
                }
                detail.setSubtotal(itemSubtotal);

                if (qty.compareTo(BigDecimal.ZERO) > 0) {
                    detail.setNetUnitPrice(itemSubtotal.divide(qty, 2, java.math.RoundingMode.HALF_UP));
                } else {
                    detail.setNetUnitPrice(price);
                }

                sumItemsSubtotal = sumItemsSubtotal.add(itemSubtotal);
            }
        }

        purchase.setSubtotal(sumItemsSubtotal);

        BigDecimal invDiscPercent = purchase.getDiscountPercent() != null ? purchase.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal invDiscAmount = purchase.getDiscountAmount() != null ? purchase.getDiscountAmount() : BigDecimal.ZERO;

        if (invDiscPercent.compareTo(BigDecimal.ZERO) > 0) {
            invDiscAmount = sumItemsSubtotal.multiply(invDiscPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            purchase.setDiscountAmount(invDiscAmount);
        } else if (invDiscAmount.compareTo(BigDecimal.ZERO) > 0 && sumItemsSubtotal.compareTo(BigDecimal.ZERO) > 0) {
            invDiscPercent = invDiscAmount.divide(sumItemsSubtotal, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, java.math.RoundingMode.HALF_UP);
            purchase.setDiscountPercent(invDiscPercent);
        } else {
            purchase.setDiscountPercent(BigDecimal.ZERO);
            purchase.setDiscountAmount(BigDecimal.ZERO);
        }

        BigDecimal finalTotal = sumItemsSubtotal.subtract(purchase.getDiscountAmount());
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }
        purchase.setTotalAmount(finalTotal);
    }

    @Transactional
    public void processStockUpdate(Purchase purchase) {
        for (PurchaseDetail detail : purchase.getDetails()) {
            BigDecimal effectivePurchasePrice = detail.getNetUnitPrice() != null 
                    ? detail.getNetUnitPrice() 
                    : (detail.getUnitPrice() != null ? detail.getUnitPrice() : BigDecimal.ZERO);

            inventoryService.recordMovement(
                    purchase.getBranch().getId(),
                    detail.getProduct().getId(),
                    "IN",
                    detail.getQuantity(),
                    detail.getBatchNumber(),
                    detail.getExpiryDate(),
                    purchase.getInvoiceNumber() != null ? purchase.getInvoiceNumber() : "PO-" + purchase.getId(),
                    "Purchase from " + purchase.getSupplier().getName(),
                    effectivePurchasePrice
            );

            // Synchronize master product reference purchase price with latest purchase price
            if (detail.getProduct() != null && effectivePurchasePrice.compareTo(BigDecimal.ZERO) > 0) {
                Product product = detail.getProduct();
                product.setPurchasePrice(effectivePurchasePrice);
                productRepository.save(product);
            }
        }
    }
}
