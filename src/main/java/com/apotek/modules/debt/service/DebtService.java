package com.apotek.modules.debt.service;
import com.apotek.modules.debt.model.*;
import com.apotek.modules.debt.repository.*;

import com.apotek.modules.masterdata.model.Branch;
import com.apotek.modules.masterdata.repository.BranchRepository;
import com.apotek.modules.purchasing.model.Purchase;
import com.apotek.modules.sales.model.Sale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DebtService {

    private final DebtRepository debtRepository;
    private final DebtPaymentRepository debtPaymentRepository;
    private final BranchRepository branchRepository;

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
        String customerName = (sale.getCustomer() != null && sale.getCustomer().getName() != null)
                ? sale.getCustomer().getName()
                : "Walk-in Customer";
        Debt debt = Debt.builder()
                .type("HUTANG_PENJUALAN")
                .sale(sale)
                .branch(sale.getBranch())
                .referenceNumber("#SAL-" + sale.getId())
                .partyName(customerName)
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
        String suppName = (purchase.getSupplier() != null && purchase.getSupplier().getName() != null)
                ? purchase.getSupplier().getName()
                : "Supplier";
        String refNum = (purchase.getInvoiceNumber() != null && !purchase.getInvoiceNumber().isBlank())
                ? purchase.getInvoiceNumber()
                : "#PUR-" + purchase.getId();
        Debt debt = Debt.builder()
                .type("HUTANG_PEMBELIAN")
                .purchase(purchase)
                .branch(purchase.getBranch())
                .referenceNumber(refNum)
                .partyName(suppName)
                .dueDate(LocalDate.now().plusDays(30)) // Default 30 days due date
                .totalAmount(purchase.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .notes(purchase.getNotes())
                .build();
        debtRepository.save(debt);
    }

    @Transactional
    public Debt createManualDebt(
            String type,
            Long branchId,
            String partyName,
            String referenceNumber,
            LocalDate dueDate,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            String notes
    ) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Total nominal hutang harus lebih besar dari 0");
        }
        String normalizedType = "HUTANG_PEMBELIAN".equalsIgnoreCase(type) ? "HUTANG_PEMBELIAN" : "HUTANG_PENJUALAN";

        Branch branch;
        if (branchId != null) {
            branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new IllegalArgumentException("Cabang tidak ditemukan"));
        } else {
            branch = branchRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Tidak ada cabang yang tersedia"));
        }

        BigDecimal initialPaid = paidAmount != null && paidAmount.compareTo(BigDecimal.ZERO) > 0
                ? paidAmount
                : BigDecimal.ZERO;
        if (initialPaid.compareTo(totalAmount) > 0) {
            throw new IllegalArgumentException("Nominal sudah dibayar tidak boleh melebihi total tagihan");
        }

        String status = "UNPAID";
        if (initialPaid.compareTo(totalAmount) >= 0) {
            status = "PAID";
        } else if (initialPaid.compareTo(BigDecimal.ZERO) > 0) {
            status = "PARTIAL";
        }

        String cleanParty = (partyName != null && !partyName.isBlank())
                ? partyName.trim()
                : ("HUTANG_PEMBELIAN".equals(normalizedType) ? "Supplier (Manual)" : "Customer (Manual)");

        String cleanRef = (referenceNumber != null && !referenceNumber.isBlank())
                ? referenceNumber.trim()
                : ("HUTANG_PEMBELIAN".equals(normalizedType) ? "#MAN-SUP-" : "#MAN-CUS-") + (System.currentTimeMillis() % 100000);

        Debt debt = Debt.builder()
                .type(normalizedType)
                .branch(branch)
                .partyName(cleanParty)
                .referenceNumber(cleanRef)
                .dueDate(dueDate != null ? dueDate : LocalDate.now().plusDays(30))
                .totalAmount(totalAmount)
                .paidAmount(initialPaid)
                .status(status)
                .notes(notes)
                .build();

        return debtRepository.save(debt);
    }

    @Transactional
    public Debt adjustDebt(
            Long debtId,
            BigDecimal newTotalAmount,
            LocalDate dueDate,
            String partyName,
            String referenceNumber,
            String adjustmentNotes
    ) {
        Debt debt = debtRepository.findById(debtId)
                .orElseThrow(() -> new IllegalArgumentException("Data hutang tidak ditemukan dengan ID: " + debtId));

        if (newTotalAmount == null || newTotalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total tagihan baru tidak valid");
        }

        BigDecimal currentPaid = debt.getPaidAmount() != null ? debt.getPaidAmount() : BigDecimal.ZERO;
        if (newTotalAmount.compareTo(currentPaid) < 0) {
            throw new IllegalArgumentException("Total tagihan baru (Rp " + newTotalAmount + ") tidak boleh lebih kecil dari jumlah yang sudah dibayar (Rp " + currentPaid + ")");
        }

        BigDecimal oldTotal = debt.getTotalAmount() != null ? debt.getTotalAmount() : BigDecimal.ZERO;
        debt.setTotalAmount(newTotalAmount);

        if (dueDate != null) {
            debt.setDueDate(dueDate);
        }
        if (partyName != null && !partyName.isBlank()) {
            debt.setPartyName(partyName.trim());
        }
        if (referenceNumber != null && !referenceNumber.isBlank()) {
            debt.setReferenceNumber(referenceNumber.trim());
        }

        if (currentPaid.compareTo(newTotalAmount) >= 0) {
            debt.setStatus("PAID");
        } else if (currentPaid.compareTo(BigDecimal.ZERO) > 0) {
            debt.setStatus("PARTIAL");
        } else {
            debt.setStatus("UNPAID");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String reason = (adjustmentNotes != null && !adjustmentNotes.isBlank()) ? adjustmentNotes.trim() : "Penyesuaian nominal";
        String auditEntry = String.format("[Adjustment %s: Rp %s -> Rp %s | %s]",
                timestamp,
                oldTotal.stripTrailingZeros().toPlainString(),
                newTotalAmount.stripTrailingZeros().toPlainString(),
                reason);

        String existingNotes = debt.getNotes();
        if (existingNotes == null || existingNotes.isBlank()) {
            debt.setNotes(auditEntry);
        } else {
            debt.setNotes(existingNotes + " | " + auditEntry);
        }

        return debtRepository.save(debt);
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
