package com.apotek.modules.debt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.purchasing.Purchase;
import com.apotek.modules.sales.Sale;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "debts")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Debt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // HUTANG_PENJUALAN (Piutang Customer), HUTANG_PEMBELIAN (Hutang Supplier)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_id")
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private BigDecimal paidAmount;

    @Column(nullable = false)
    private String status; // UNPAID, PARTIAL, PAID

    private String notes;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Sale getSale() { return sale; }
    public void setSale(Sale sale) { this.sale = sale; }
    public Purchase getPurchase() { return purchase; }
    public void setPurchase(Purchase purchase) { this.purchase = purchase; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        if (this.tenantId == null) {
            this.tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        }
    }

    public static DebtBuilder builder() { return new DebtBuilder(); }

    public static class DebtBuilder {
        private String type;
        private Sale sale;
        private Purchase purchase;
        private Branch branch;
        private LocalDate dueDate;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private String status;
        private String notes;
        private String tenantId;

        public DebtBuilder type(String type) { this.type = type; return this; }
        public DebtBuilder sale(Sale sale) { this.sale = sale; return this; }
        public DebtBuilder purchase(Purchase purchase) { this.purchase = purchase; return this; }
        public DebtBuilder branch(Branch branch) { this.branch = branch; return this; }
        public DebtBuilder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }
        public DebtBuilder totalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; return this; }
        public DebtBuilder paidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; return this; }
        public DebtBuilder status(String status) { this.status = status; return this; }
        public DebtBuilder notes(String notes) { this.notes = notes; return this; }
        public DebtBuilder tenantId(String tenantId) { this.tenantId = tenantId; return this; }

        public Debt build() {
            Debt debt = new Debt();
            debt.setType(type);
            debt.setSale(sale);
            debt.setPurchase(purchase);
            debt.setBranch(branch);
            debt.setDueDate(dueDate);
            debt.setTotalAmount(totalAmount);
            debt.setPaidAmount(paidAmount);
            debt.setStatus(status);
            debt.setNotes(notes);
            debt.setTenantId(tenantId);
            return debt;
        }
    }
}
