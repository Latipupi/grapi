package com.apotek.modules.sales;

import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import com.apotek.modules.inventory.InventoryService;
import com.apotek.modules.debt.Debt;
import com.apotek.modules.debt.DebtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SalesReturnService {

    private final SalesReturnRepository salesReturnRepository;
    private final SalesReturnDetailRepository salesReturnDetailRepository;
    private final SaleRepository saleRepository;
    private final SaleDetailRepository saleDetailRepository;
    private final InventoryService inventoryService;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CashierShiftRepository shiftRepository;
    private final DebtRepository debtRepository;

    public List<SalesReturn> getAllReturns(Long branchId) {
        if (branchId != null) {
            return salesReturnRepository.findByBranchIdOrderByReturnDateDesc(branchId);
        }
        return salesReturnRepository.findAll();
    }

    public List<SalesReturn> getReturnsBySale(Long saleId) {
        return salesReturnRepository.findBySaleIdOrderByReturnDateDesc(saleId);
    }

    public SalesReturn getReturnById(Long id) {
        return salesReturnRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales return not found with ID: " + id));
    }

    @Transactional
    public SalesReturn processReturn(CreateReturnRequest request) {
        Sale sale = saleRepository.findById(request.getSaleId())
                .orElseThrow(() -> new IllegalArgumentException("Sale not found with ID: " + request.getSaleId()));
        
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with ID: " + request.getBranchId()));
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + request.getUserId()));

        // Active Shift check (similar to sales)
        CashierShift activeShift = shiftRepository.findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(user.getId(), branch.getId(), "OPEN")
                .orElse(null);

        SalesReturn salesReturn = SalesReturn.builder()
                .sale(sale)
                .branch(branch)
                .user(user)
                .shift(activeShift)
                .returnDate(LocalDateTime.now())
                .reason(request.getReason())
                .totalRefundAmount(BigDecimal.ZERO)
                .build();

        salesReturn = salesReturnRepository.save(salesReturn);

        BigDecimal totalRefund = BigDecimal.ZERO;
        List<SalesReturnDetail> details = new ArrayList<>();

        for (ReturnItemRequest item : request.getItems()) {
            SaleDetail saleDetail = saleDetailRepository.findById(item.getSaleDetailId())
                    .orElseThrow(() -> new IllegalArgumentException("Sale detail not found with ID: " + item.getSaleDetailId()));

            // Validate that this detail belongs to the sale
            if (!saleDetail.getSale().getId().equals(sale.getId())) {
                throw new IllegalArgumentException("Sale detail " + item.getSaleDetailId() + " does not belong to sale " + sale.getId());
            }

            // Calculate already returned quantity
            BigDecimal alreadyReturned = salesReturnDetailRepository.sumReturnedQuantityBySaleDetailId(saleDetail.getId());
            BigDecimal remainingQty = saleDetail.getQuantity().subtract(alreadyReturned);

            if (item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                continue; // Skip items with 0 or negative quantity
            }

            if (item.getQuantity().compareTo(remainingQty) > 0) {
                throw new IllegalArgumentException("Returned quantity (" + item.getQuantity() + ") exceeds remaining quantity (" + remainingQty + ") for product: " + saleDetail.getProduct().getName());
            }

            // Refund amount for this item
            BigDecimal itemRefund = item.getQuantity().multiply(saleDetail.getUnitPrice());

            SalesReturnDetail returnDetail = SalesReturnDetail.builder()
                    .salesReturn(salesReturn)
                    .saleDetail(saleDetail)
                    .product(saleDetail.getProduct())
                    .batch(saleDetail.getBatch())
                    .quantity(item.getQuantity())
                    .refundAmount(itemRefund)
                    .build();

            details.add(returnDetail);
            totalRefund = totalRefund.add(itemRefund);

            // Return stock to inventory (IN movement)
            // Quantity to return in base unit = quantity * conversion_factor
            BigDecimal baseQtyToReturn = item.getQuantity().multiply(BigDecimal.valueOf(saleDetail.getConversionFactor()));

            inventoryService.recordMovement(
                    branch.getId(),
                    saleDetail.getProduct().getId(),
                    "IN",
                    baseQtyToReturn,
                    saleDetail.getBatch().getBatchNumber(),
                    saleDetail.getBatch().getExpiryDate(),
                    "RETURN-SALE-" + salesReturn.getId(),
                    "Retur Penjualan dari Transaksi #" + sale.getId() + " - " + request.getReason(),
                    saleDetail.getPurchasePrice()
            );
        }

        if (details.isEmpty()) {
            throw new IllegalArgumentException("No items were returned");
        }

        salesReturn.setTotalRefundAmount(totalRefund);
        for (SalesReturnDetail detail : details) {
            salesReturn.addDetail(detail);
        }

        SalesReturn savedReturn = salesReturnRepository.save(salesReturn);

        // Adjust Debt if the sale payment method is HUTANG
        if ("HUTANG".equalsIgnoreCase(sale.getPaymentMethod())) {
            Optional<Debt> debtOpt = debtRepository.findBySaleId(sale.getId());
            if (debtOpt.isPresent()) {
                Debt debt = debtOpt.get();
                BigDecimal newTotalAmount = debt.getTotalAmount().subtract(totalRefund);
                if (newTotalAmount.compareTo(debt.getPaidAmount()) < 0) {
                    debt.setTotalAmount(debt.getPaidAmount());
                    debt.setStatus("PAID");
                } else {
                    debt.setTotalAmount(newTotalAmount);
                    if (debt.getPaidAmount().compareTo(newTotalAmount) >= 0) {
                        debt.setStatus("PAID");
                    } else if (debt.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                        debt.setStatus("PARTIAL");
                    } else {
                        debt.setStatus("UNPAID");
                    }
                }
                debtRepository.save(debt);
            }
        }

        return savedReturn;
    }

    public static class CreateReturnRequest {
        private Long saleId;
        private Long branchId;
        private Long userId;
        private String reason;
        private List<ReturnItemRequest> items;

        public Long getSaleId() { return saleId; }
        public void setSaleId(Long saleId) { this.saleId = saleId; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public List<ReturnItemRequest> getItems() { return items; }
        public void setItems(List<ReturnItemRequest> items) { this.items = items; }
    }

    public static class ReturnItemRequest {
        private Long saleDetailId;
        private BigDecimal quantity;

        public Long getSaleDetailId() { return saleDetailId; }
        public void setSaleDetailId(Long saleDetailId) { this.saleDetailId = saleDetailId; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    }
}
