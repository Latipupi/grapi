package com.apotek.modules.purchasing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Supplier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    private String invoiceNumber;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String status; // DRAFT, RECEIVED, CANCELLED

    private String paymentMethod; // CASH, TRANSFER, HUTANG

    private String notes;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseDetail> details = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<PurchaseDetail> getDetails() { return details; }
    public void setDetails(List<PurchaseDetail> details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static PurchaseBuilder builder() { return new PurchaseBuilder(); }

    public static class PurchaseBuilder {
        private Supplier supplier;
        private Branch branch;
        private LocalDate purchaseDate;
        private String invoiceNumber;
        private BigDecimal totalAmount;
        private String status;
        private String paymentMethod;
        private String notes;
        public PurchaseBuilder supplier(Supplier supplier) { this.supplier = supplier; return this; }
        public PurchaseBuilder branch(Branch branch) { this.branch = branch; return this; }
        public PurchaseBuilder purchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; return this; }
        public PurchaseBuilder invoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; return this; }
        public PurchaseBuilder totalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; return this; }
        public PurchaseBuilder status(String status) { this.status = status; return this; }
        public PurchaseBuilder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public PurchaseBuilder notes(String notes) { this.notes = notes; return this; }
        public Purchase build() {
            Purchase purchase = new Purchase();
            purchase.setSupplier(supplier);
            purchase.setBranch(branch);
            purchase.setPurchaseDate(purchaseDate);
            purchase.setInvoiceNumber(invoiceNumber);
            purchase.setTotalAmount(totalAmount);
            purchase.setStatus(status);
            purchase.setPaymentMethod(paymentMethod);
            purchase.setNotes(notes);
            return purchase;
        }
    }

    public void addDetail(PurchaseDetail detail) {
        details.add(detail);
        detail.setPurchase(this);
    }
}
