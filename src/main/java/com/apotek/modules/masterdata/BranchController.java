package com.apotek.modules.masterdata;

import com.apotek.modules.auth.Tenant;
import com.apotek.modules.auth.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchRepository branchRepository;
    private final TenantRepository tenantRepository;

    @GetMapping
    public List<Branch> getAll() {
        return branchRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> create(@RequestBody Branch branch) {
        String tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            long currentBranches = branchRepository.count();
            if (currentBranches >= tenant.getMaxBranches()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Batas jumlah cabang untuk paket langganan Apotek Anda telah tercapai (maksimal " + tenant.getMaxBranches() + " cabang). Silakan upgrade paket."));
            }
        }
        Branch savedBranch = branchRepository.save(branch);
        return ResponseEntity.ok(savedBranch);
    }

    @lombok.Data
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String message;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Branch> getById(@PathVariable Long id) {
        return branchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Branch> update(@PathVariable Long id, @RequestBody Branch branchDetails) {
        return branchRepository.findById(id)
                .map(branch -> {
                    branch.setName(branchDetails.getName());
                    branch.setAddress(branchDetails.getAddress());
                    branch.setPhone(branchDetails.getPhone());
                    branch.setActive(branchDetails.isActive());
                    return ResponseEntity.ok(branchRepository.save(branch));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return branchRepository.findById(id)
                .map(branch -> {
                    branchRepository.delete(branch);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
