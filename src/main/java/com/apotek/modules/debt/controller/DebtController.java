package com.apotek.modules.debt.controller;
import com.apotek.modules.debt.model.*;
import com.apotek.modules.debt.repository.*;
import com.apotek.modules.debt.service.*;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public List<Debt> getDebts(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String type) {
        return debtService.getDebts(branchId, type);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public Debt createManualDebt(@RequestBody CreateManualDebtRequest request) {
        return debtService.createManualDebt(
                request.getType(),
                request.getBranchId(),
                request.getPartyName(),
                request.getReferenceNumber(),
                request.getDueDate(),
                request.getTotalAmount(),
                request.getPaidAmount(),
                request.getNotes()
        );
    }

    @PutMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public Debt adjustDebt(@PathVariable Long id, @RequestBody AdjustDebtRequest request) {
        return debtService.adjustDebt(
                id,
                request.getTotalAmount(),
                request.getDueDate(),
                request.getPartyName(),
                request.getReferenceNumber(),
                request.getAdjustmentNotes()
        );
    }

    @GetMapping("/{id}/payments")
    public List<DebtPayment> getPayments(@PathVariable Long id) {
        return debtService.getPayments(id);
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public DebtPayment pay(@PathVariable Long id, @RequestBody PayRequest request) {
        return debtService.recordPayment(id, request.getAmount(), request.getPaymentMethod(), request.getNotes());
    }

    @Data
    public static class CreateManualDebtRequest {
        private String type; // HUTANG_PEMBELIAN or HUTANG_PENJUALAN
        private Long branchId;
        private String partyName;
        private String referenceNumber;
        private java.time.LocalDate dueDate;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private String notes;
    }

    @Data
    public static class AdjustDebtRequest {
        private BigDecimal totalAmount;
        private java.time.LocalDate dueDate;
        private String partyName;
        private String referenceNumber;
        private String adjustmentNotes;
    }

    @Data
    public static class PayRequest {
        private BigDecimal amount;
        private String paymentMethod;
        private String notes;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
