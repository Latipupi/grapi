package com.apotek.modules.sales;

import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.inventory.InventoryBatch;
import com.apotek.modules.inventory.InventoryBatchRepository;
import com.apotek.modules.inventory.InventoryService;
import com.apotek.modules.masterdata.*;
import com.apotek.modules.debt.DebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SaleRepository saleRepository;
    private final InventoryBatchRepository batchRepository;
    private final InventoryService inventoryService;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductUnitRepository unitRepository;
    private final DebtService debtService;
    private final CashierShiftRepository shiftRepository;

    @Transactional
    public Sale processSale(CreateSaleRequest request) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Customer customer = request.getCustomerId() != null 
                ? customerRepository.findById(request.getCustomerId()).orElse(null) 
                : null;

        // Validasi shift aktif - kasir WAJIB membuka shift sebelum bertransaksi di cabang ini
        CashierShift activeShift = shiftRepository.findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(user.getId(), branch.getId(), "OPEN")
                .orElseThrow(() -> new IllegalStateException(
                        "Shift belum dibuka! Silakan buka shift terlebih dahulu sebelum melakukan transaksi di cabang ini."));

        Sale sale = Sale.builder()
                .branch(branch)
                .user(user)
                .customer(customer)
                .shift(activeShift)
                .saleDate(LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .status("COMPLETED")
                .totalAmount(BigDecimal.ZERO)
                .build();

        // Save first to get an ID for reference numbers
        sale = saleRepository.save(sale);

        BigDecimal totalSaleAmount = BigDecimal.ZERO;
        List<SaleDetail> details = new ArrayList<>();

        for (CartItem item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

            ProductUnit unit = unitRepository.findById(item.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Unit not found: " + item.getUnitId()));

            // Convert sell quantity to base unit quantity
            BigDecimal conversionFactor = BigDecimal.valueOf(unit.getConversionToBase());
            BigDecimal totalBaseQtyToSell = item.getQuantity().multiply(conversionFactor);
            BigDecimal remainingBaseQtyToSell = totalBaseQtyToSell;
            
            // FEFO Logic: Get batches sorted by expiry date
            List<InventoryBatch> batches = batchRepository.findByBranchIdAndProductIdOrderByExpiryDateAsc(
                    branch.getId(), product.getId()
            );

            for (InventoryBatch batch : batches) {
                if (remainingBaseQtyToSell.compareTo(BigDecimal.ZERO) <= 0) break;
                if (batch.getCurrentQuantity().compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal qtyToTakeFromBatch = remainingBaseQtyToSell.min(batch.getCurrentQuantity());
                
                // Deduct from batch via InventoryService
                inventoryService.recordMovement(
                        branch.getId(),
                        product.getId(),
                        "OUT",
                        qtyToTakeFromBatch,
                        batch.getBatchNumber(),
                        batch.getExpiryDate(),
                        "SALE-" + sale.getId(), 
                        "Point of Sale (" + unit.getUnitName() + ")",
                        batch.getPurchasePrice()
                );

                SaleDetail detail = SaleDetail.builder()
                        .product(product)
                        .batch(batch)
                        .quantity(qtyToTakeFromBatch.divide(conversionFactor, 4, java.math.RoundingMode.HALF_UP))
                        .unitPrice(item.getUnitPrice())
                        .subtotal(qtyToTakeFromBatch.divide(conversionFactor, 4, java.math.RoundingMode.HALF_UP).multiply(item.getUnitPrice()))
                        .purchasePrice(batch.getPurchasePrice())
                        .conversionFactor(unit.getConversionToBase())
                        .build();
                
                details.add(detail);
                totalSaleAmount = totalSaleAmount.add(detail.getSubtotal());
                remainingBaseQtyToSell = remainingBaseQtyToSell.subtract(qtyToTakeFromBatch);
            }

            if (remainingBaseQtyToSell.compareTo(BigDecimal.ZERO) > 0) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName() + 
                        ". Shortage: " + remainingBaseQtyToSell.divide(conversionFactor, 2, java.math.RoundingMode.HALF_UP) + " " + unit.getUnitName());
            }
        }

        sale.setTotalAmount(totalSaleAmount);
        Sale savedSale = saleRepository.save(sale);
        
        for (SaleDetail detail : details) {
            savedSale.addDetail(detail);
        }

        Sale finalSale = saleRepository.save(savedSale);
        debtService.createDebtFromSale(finalSale);
        return saleRepository.findById(finalSale.getId()).orElse(finalSale);
    }

    public static class CreateSaleRequest {
        private Long branchId;
        private Long userId;
        private Long customerId;
        private String paymentMethod;
        private List<CartItem> items;

        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public List<CartItem> getItems() { return items; }
        public void setItems(List<CartItem> items) { this.items = items; }
    }

    public static class CartItem {
        private Long productId;
        private Long unitId;
        private BigDecimal quantity;
        private BigDecimal unitPrice;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Long getUnitId() { return unitId; }
        public void setUnitId(Long unitId) { this.unitId = unitId; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }
}
