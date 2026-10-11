package com.apotek.modules.sales.service;
import com.apotek.modules.sales.model.*;
import com.apotek.modules.sales.repository.*;

import com.apotek.modules.auth.model.User;
import com.apotek.modules.auth.repository.UserRepository;
import com.apotek.modules.inventory.model.InventoryBatch;
import com.apotek.modules.inventory.repository.InventoryBatchRepository;
import com.apotek.modules.inventory.service.InventoryService;
import com.apotek.modules.masterdata.model.*;
import com.apotek.modules.masterdata.repository.*;
import com.apotek.modules.masterdata.controller.*;
import com.apotek.modules.debt.service.DebtService;
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
            if (Boolean.TRUE.equals(item.getIsCompound())) {
                // Proses Penjualan Obat Racikan (Compound Prescription)
                if (item.getIngredients() == null || item.getIngredients().isEmpty()) {
                    throw new IllegalArgumentException("Komposisi bahan obat racikan tidak boleh kosong!");
                }

                String compoundName = (item.getCompoundName() != null && !item.getCompoundName().trim().isEmpty())
                        ? item.getCompoundName().trim() : "Obat Racikan";
                String packageType = (item.getPackageType() != null && !item.getPackageType().trim().isEmpty())
                        ? item.getPackageType().trim() : "Bungkus";
                BigDecimal serviceFee = item.getServiceFee() != null ? item.getServiceFee() : BigDecimal.ZERO;
                BigDecimal compoundQty = (item.getQuantity() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                        ? item.getQuantity() : BigDecimal.ONE;

                BigDecimal totalIngredientsSubtotal = BigDecimal.ZERO;
                BigDecimal totalIngredientsCost = BigDecimal.ZERO;
                List<SaleDetailIngredient> detailIngredients = new ArrayList<>();

                for (CompoundIngredientItem ing : item.getIngredients()) {
                    Product ingProduct = productRepository.findById(ing.getProductId())
                            .orElseThrow(() -> new IllegalArgumentException("Bahan obat racikan tidak ditemukan: " + ing.getProductId()));

                    ProductUnit ingUnit = resolveProductUnit(ingProduct, ing.getUnitId(), ing.getUnitPrice());
                    BigDecimal conversionFactor = BigDecimal.valueOf(ingUnit.getConversionToBase());
                    BigDecimal totalBaseQtyToSell = ing.getQuantity().multiply(conversionFactor);
                    BigDecimal remainingBaseQtyToSell = totalBaseQtyToSell;

                    List<InventoryBatch> batches = batchRepository.findByBranchIdAndProductIdOrderByExpiryDateAsc(
                            branch.getId(), ingProduct.getId()
                    );

                    for (InventoryBatch batch : batches) {
                        if (remainingBaseQtyToSell.compareTo(BigDecimal.ZERO) <= 0) break;
                        if (batch.getCurrentQuantity().compareTo(BigDecimal.ZERO) <= 0) continue;

                        BigDecimal qtyToTakeFromBatch = remainingBaseQtyToSell.min(batch.getCurrentQuantity());

                        inventoryService.recordMovement(
                                branch.getId(),
                                ingProduct.getId(),
                                "OUT",
                                qtyToTakeFromBatch,
                                batch.getBatchNumber(),
                                batch.getExpiryDate(),
                                "SALE-" + sale.getId(),
                                "Bahan Racikan: " + compoundName + " (" + ingUnit.getUnitName() + ")",
                                batch.getPurchasePrice()
                        );

                        BigDecimal ingQtyTakenInUnit = qtyToTakeFromBatch.divide(conversionFactor, 4, java.math.RoundingMode.HALF_UP);
                        BigDecimal ingSubtotal = ingQtyTakenInUnit.multiply(ing.getUnitPrice());
                        BigDecimal ingCost = ingQtyTakenInUnit.multiply(batch.getPurchasePrice() != null ? batch.getPurchasePrice() : BigDecimal.ZERO);

                        SaleDetailIngredient detailIngredient = SaleDetailIngredient.builder()
                                .product(ingProduct)
                                .batch(batch)
                                .quantity(ingQtyTakenInUnit)
                                .unitPrice(ing.getUnitPrice())
                                .subtotal(ingSubtotal)
                                .purchasePrice(batch.getPurchasePrice() != null ? batch.getPurchasePrice() : BigDecimal.ZERO)
                                .build();

                        detailIngredients.add(detailIngredient);
                        totalIngredientsSubtotal = totalIngredientsSubtotal.add(ingSubtotal);
                        totalIngredientsCost = totalIngredientsCost.add(ingCost);
                        remainingBaseQtyToSell = remainingBaseQtyToSell.subtract(qtyToTakeFromBatch);
                    }

                    if (remainingBaseQtyToSell.compareTo(BigDecimal.ZERO) > 0) {
                        throw new IllegalStateException("Stok tidak mencukupi untuk bahan racikan: " + ingProduct.getName() + 
                                ". Kekurangan: " + remainingBaseQtyToSell.divide(conversionFactor, 2, java.math.RoundingMode.HALF_UP) + " " + ingUnit.getUnitName());
                    }
                }

                BigDecimal compoundTotal = totalIngredientsSubtotal.add(serviceFee);
                BigDecimal unitPrice = compoundTotal.divide(compoundQty, 2, java.math.RoundingMode.HALF_UP);
                BigDecimal unitHpp = totalIngredientsCost.divide(compoundQty, 4, java.math.RoundingMode.HALF_UP);

                SaleDetail compoundDetail = SaleDetail.builder()
                        .isCompound(true)
                        .compoundName(compoundName)
                        .packageType(packageType)
                        .doseRule(item.getDoseRule())
                        .serviceFee(serviceFee)
                        .quantity(compoundQty)
                        .unitPrice(unitPrice)
                        .subtotal(compoundTotal)
                        .purchasePrice(unitHpp)
                        .conversionFactor(1)
                        .ingredients(detailIngredients)
                        .build();

                details.add(compoundDetail);
                totalSaleAmount = totalSaleAmount.add(compoundTotal);

            } else {
                // Proses Penjualan Produk Biasa (Standard Non-Compound)
                Product product = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

                ProductUnit unit = resolveProductUnit(product, item.getUnitId(), item.getUnitPrice());

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
                            .purchasePrice(batch.getPurchasePrice() != null ? batch.getPurchasePrice() : BigDecimal.ZERO)
                            .conversionFactor(unit.getConversionToBase())
                            .isCompound(false)
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

    private ProductUnit resolveProductUnit(Product product, Long unitId, BigDecimal unitPrice) {
        ProductUnit unit = unitId != null ? unitRepository.findById(unitId).orElse(null) : null;
        if (unit != null) return unit;

        // Robust fallback to prevent cashier cart loss when product units have been recreated:
        // 1. Try to find a unit on this product with the exact same price
        if (unitPrice != null) {
            unit = product.getUnits().stream()
                    .filter(u -> u.getPricePerUnit() != null && u.getPricePerUnit().compareTo(unitPrice) == 0)
                    .findFirst()
                    .orElse(null);
            
            // 2. Try to find a unit on this product with matching additional prices
            if (unit == null) {
                unit = product.getUnits().stream()
                        .filter(u -> u.getAdditionalPrices().stream().anyMatch(ap -> ap.getPrice().compareTo(unitPrice) == 0))
                        .findFirst()
                        .orElse(null);
            }
        }
        
        // 3. Fallback to base unit
        if (unit == null) {
            unit = product.getUnits().stream()
                    .filter(ProductUnit::isBaseUnit)
                    .findFirst()
                    .orElse(null);
        }
        
        // 4. Fallback to first available unit
        if (unit == null && !product.getUnits().isEmpty()) {
            unit = product.getUnits().iterator().next();
        }
        
        // 5. Final fallback - throw exception
        if (unit == null) {
            throw new IllegalArgumentException("Unit not found for product: " + product.getName());
        }
        return unit;
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

        // Compound prescription fields
        private Boolean isCompound;
        private String compoundName;
        private String doseRule;
        private BigDecimal serviceFee;
        private String packageType;
        private List<CompoundIngredientItem> ingredients;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Long getUnitId() { return unitId; }
        public void setUnitId(Long unitId) { this.unitId = unitId; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

        public Boolean getIsCompound() { return isCompound; }
        public void setIsCompound(Boolean isCompound) { this.isCompound = isCompound; }
        public String getCompoundName() { return compoundName; }
        public void setCompoundName(String compoundName) { this.compoundName = compoundName; }
        public String getDoseRule() { return doseRule; }
        public void setDoseRule(String doseRule) { this.doseRule = doseRule; }
        public BigDecimal getServiceFee() { return serviceFee; }
        public void setServiceFee(BigDecimal serviceFee) { this.serviceFee = serviceFee; }
        public String getPackageType() { return packageType; }
        public void setPackageType(String packageType) { this.packageType = packageType; }
        public List<CompoundIngredientItem> getIngredients() { return ingredients; }
        public void setIngredients(List<CompoundIngredientItem> ingredients) { this.ingredients = ingredients; }
    }

    public static class CompoundIngredientItem {
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
