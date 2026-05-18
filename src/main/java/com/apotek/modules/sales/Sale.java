package com.apotek.modules.sales;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.apotek.modules.auth.User;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.Customer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(nullable = false)
    private LocalDateTime saleDate;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private String status; // COMPLETED, CANCELLED

    private String notes;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SaleDetail> details = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static SaleBuilder builder() { return new SaleBuilder(); }

    public static class SaleBuilder {
        private Branch branch;
        private User user;
        private Customer customer;
        private LocalDateTime saleDate;
        private BigDecimal totalAmount;
        private String paymentMethod;
        private String status;
        private String notes;
        public SaleBuilder branch(Branch branch) { this.branch = branch; return this; }
        public SaleBuilder user(User user) { this.user = user; return this; }
        public SaleBuilder customer(Customer customer) { this.customer = customer; return this; }
        public SaleBuilder saleDate(LocalDateTime saleDate) { this.saleDate = saleDate; return this; }
        public SaleBuilder totalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; return this; }
        public SaleBuilder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public SaleBuilder status(String status) { this.status = status; return this; }
        public SaleBuilder notes(String notes) { this.notes = notes; return this; }
        public Sale build() {
            Sale sale = new Sale();
            sale.setBranch(branch);
            sale.setUser(user);
            sale.setCustomer(customer);
            sale.setSaleDate(saleDate);
            sale.setTotalAmount(totalAmount);
            sale.setPaymentMethod(paymentMethod);
            sale.setStatus(status);
            sale.setNotes(notes);
            return sale;
        }
    }

    public void addDetail(SaleDetail detail) {
        details.add(detail);
        detail.setSale(this);
    }
}
