package com.apotek.modules.debt;

import com.apotek.modules.purchasing.Purchase;
import com.apotek.modules.sales.Sale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DebtService {

    private final DebtRepository debtRepository;
    private final DebtPaymentRepository debtPaymentRepository;

    public List<Debt> getDebts(Long branchId, String type) {
        if (branchId != null && type != null && !type.isEmpty()) {
            return debtRepository.findByBranchIdAndTypeOrderByDueDateDesc(branchId, type);
        } else if (branchId != null) {
            return debtRepository.findByBranchIdOrderByDueDateDesc(branchId);
        } else if (type != null && !type.isEmpty()) {
            return debtRepository.findByTypeOrderByDueDateDesc(type);
        }
        return debtRepository.findAll();
    }

    @Transactional
    public void createDebtFromSale(Sale sale) {
        if (!"HUTANG".equalsIgnoreCase(sale.getPaymentMethod())) {
            return;
        }
        Debt debt = Debt.builder()
                .type("HUTANG_PENJUALAN")
                .sale(sale)
                .branch(sale.getBranch())
                .dueDate(LocalDate.now().plusDays(30)) // Default 30 days due date
                .totalAmount(sale.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .notes(sale.getNotes())
                .build();
        debtRepository.save(debt);
    }

    @Transactional
    public void createDebtFromPurchase(Purchase purchase) {
        if (!"HUTANG".equalsIgnoreCase(purchase.getPaymentMethod())) {
            return;
        }
        Debt debt = Debt.builder()
                .type("HUTANG_PEMBELIAN")
                .purchase(purchase)
                .branch(purchase.getBranch())
                .dueDate(LocalDate.now().plusDays(30)) // Default 30 days due date
                .totalAmount(purchase.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .notes(purchase.getNotes())
                .build();
        debtRepository.save(debt);
    }

    @Transactional
    public DebtPayment recordPayment(Long debtId, BigDecimal amount, String paymentMethod, String notes) {
        Debt debt = debtRepository.findById(debtId)
                .orElseThrow(() -> new IllegalArgumentException("Debt not found with ID: " + debtId));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pembayaran harus lebih besar dari 0");
        }

        BigDecimal remaining = debt.getTotalAmount().subtract(debt.getPaidAmount());
        if (amount.compareTo(remaining) > 0) {
            throw new IllegalArgumentException("Nominal pembayaran melebihi sisa tagihan (Sisa: Rp " + remaining + ")");
        }

        DebtPayment payment = DebtPayment.builder()
                .debt(debt)
                .amount(amount)
                .paymentDate(LocalDateTime.now())
                .paymentMethod(paymentMethod)
                .notes(notes)
                .build();

        debtPaymentRepository.save(payment);

        BigDecimal newPaidAmount = debt.getPaidAmount().add(amount);
        debt.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(debt.getTotalAmount()) >= 0) {
            debt.setStatus("PAID");
        } else {
            debt.setStatus("PARTIAL");
        }

        debtRepository.save(debt);
        return payment;
    }

    public List<DebtPayment> getPayments(Long debtId) {
        return debtPaymentRepository.findByDebtIdOrderByPaymentDateDesc(debtId);
    }
}
