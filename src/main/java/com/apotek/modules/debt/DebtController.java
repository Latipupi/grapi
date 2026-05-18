package com.apotek.modules.debt;

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
