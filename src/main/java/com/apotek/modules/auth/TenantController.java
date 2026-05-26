package com.apotek.modules.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantRepository tenantRepository;

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Tenant> getCurrentTenant() {
        String tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        return tenantRepository.findById(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Tenant> updateCurrentTenant(@RequestBody Tenant details) {
        String tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        return tenantRepository.findById(tenantId)
                .map(tenant -> {
                    tenant.setName(details.getName());
                    tenant.setEmail(details.getEmail());
                    tenant.setPhone(details.getPhone());
                    tenant.setNpwp(details.getNpwp());
                    tenant.setAddress(details.getAddress());
                    return ResponseEntity.ok(tenantRepository.save(tenant));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
