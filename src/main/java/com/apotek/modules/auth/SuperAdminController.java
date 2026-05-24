package com.apotek.modules.auth;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final TenantRepository tenantRepository;

    private void validateSuperAdmin() {
        String currentTenant = com.apotek.core.security.TenantContext.getCurrentTenant();
        if (!"SYSTEM".equals(currentTenant)) {
            throw new org.springframework.security.access.AccessDeniedException("Hanya Super Admin yang diizinkan mengakses menu ini");
        }
    }

    @GetMapping("/tenants")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> getAllTenants() {
        validateSuperAdmin();
        return ResponseEntity.ok(tenantRepository.findAll());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> getStats() {
        validateSuperAdmin();
        List<Tenant> tenants = tenantRepository.findAll();
        
        long totalTenants = tenants.size() - 1; // Exclude 'SYSTEM'
        long activeTenants = 0;
        long expiredTenants = 0;
        BigDecimal mrr = BigDecimal.ZERO;

        for (Tenant tenant : tenants) {
            if ("SYSTEM".equals(tenant.getId())) continue;
            
            if (tenant.isActive()) {
                activeTenants++;
            }
            if ("EXPIRED".equals(tenant.getBillingStatus()) || (tenant.getExpiredAt() != null && tenant.getExpiredAt().isBefore(LocalDateTime.now()))) {
                expiredTenants++;
            }
            if ("ACTIVE".equals(tenant.getBillingStatus()) && tenant.isActive()) {
                mrr = mrr.add(tenant.getPrice());
            }
        }

        return ResponseEntity.ok(SuperAdminStats.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .expiredTenants(expiredTenants)
                .monthlyRecurringRevenue(mrr)
                .build());
    }

    @PutMapping("/tenants/{id}/billing")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> updateBilling(
            @PathVariable String id,
            @RequestBody BillingUpdateRequest request
    ) {
        validateSuperAdmin();
        return tenantRepository.findById(id)
                .map(tenant -> {
                    tenant.setSubscriptionPlan(request.getSubscriptionPlan());
                    tenant.setBillingStatus(request.getBillingStatus());
                    tenant.setExpiredAt(request.getExpiredAt());
                    tenant.setMaxUsers(request.getMaxUsers());
                    tenant.setMaxBranches(request.getMaxBranches());
                    tenant.setPrice(request.getPrice());
                    tenant.setActive(request.isActive());
                    
                    Tenant saved = tenantRepository.save(tenant);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/tenants/{id}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> suspendTenant(
            @PathVariable String id,
            @RequestParam boolean active
    ) {
        validateSuperAdmin();
        return tenantRepository.findById(id)
                .map(tenant -> {
                    tenant.setActive(active);
                    if (!active) {
                        tenant.setBillingStatus("SUSPENDED");
                    } else {
                        tenant.setBillingStatus("ACTIVE");
                    }
                    Tenant saved = tenantRepository.save(tenant);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Data
    @Builder
    public static class SuperAdminStats {
        private long totalTenants;
        private long activeTenants;
        private long expiredTenants;
        private BigDecimal monthlyRecurringRevenue;
    }

    @Data
    public static class BillingUpdateRequest {
        private String subscriptionPlan;
        private String billingStatus;
        private LocalDateTime expiredAt;
        private int maxUsers;
        private int maxBranches;
        private BigDecimal price;
        private boolean active;
    }
}
