package com.apotek.modules.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tenant {

    @Id
    private String id; // e.g. 'apotek_sela'

    @Column(nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "subscription_plan", nullable = false)
    @Builder.Default
    private String subscriptionPlan = "FREE_TRIAL";

    @Column(name = "billing_status", nullable = false)
    @Builder.Default
    private String billingStatus = "ACTIVE";

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "max_users", nullable = false)
    @Builder.Default
    private int maxUsers = 2;

    @Column(name = "max_branches", nullable = false)
    @Builder.Default
    private int maxBranches = 1;

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal price = java.math.BigDecimal.ZERO;

    @Column(name = "whatsapp_number", nullable = false)
    @Builder.Default
    private String whatsappNumber = "628123456789";

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "npwp")
    private String npwp;

    @Column(name = "address")
    private String address;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (expiredAt == null) {
            expiredAt = LocalDateTime.now().plusDays(30);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
