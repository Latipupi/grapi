package com.apotek.modules.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public List<User> getAll() {
        return userRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> create(@RequestBody User user) {
        String tenantId = com.apotek.core.security.TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            long currentUsers = userRepository.count();
            if (currentUsers >= tenant.getMaxUsers()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Batas jumlah pengguna untuk paket langganan Apotek Anda telah tercapai (maksimal " + tenant.getMaxUsers() + " user). Silakan upgrade paket."));
            }
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @lombok.Data
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String message;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User details) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(details.getUsername());
                    user.setEmail(details.getEmail());
                    user.setFullName(details.getFullName());
                    user.setRole(details.getRole());
                    user.setBranchId(details.getBranchId());
                    user.setPhone(details.getPhone());
                    
                    if (details.getPassword() != null && !details.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(details.getPassword()));
                    }
                    
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
