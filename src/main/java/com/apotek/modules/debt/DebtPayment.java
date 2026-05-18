package com.apotek.modules.debt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "debt_payments")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DebtPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debt_id", nullable = false)
    @JsonIgnoreProperties("payments")
    private Debt debt;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    @Column(nullable = false)
    private String paymentMethod; // CASH, TRANSFER, etc.

    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Debt getDebt() { return debt; }
    public void setDebt(Debt debt) { this.debt = debt; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static DebtPaymentBuilder builder() { return new DebtPaymentBuilder(); }

    public static class DebtPaymentBuilder {
        private Debt debt;
        private BigDecimal amount;
        private LocalDateTime paymentDate;
        private String paymentMethod;
        private String notes;

        public DebtPaymentBuilder debt(Debt debt) { this.debt = debt; return this; }
        public DebtPaymentBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public DebtPaymentBuilder paymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; return this; }
        public DebtPaymentBuilder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public DebtPaymentBuilder notes(String notes) { this.notes = notes; return this; }

        public DebtPayment build() {
            DebtPayment payment = new DebtPayment();
            payment.setDebt(debt);
            payment.setAmount(amount);
            payment.setPaymentDate(paymentDate);
            payment.setPaymentMethod(paymentMethod);
            payment.setNotes(notes);
            return payment;
        }
    }
}
