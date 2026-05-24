package com.apotek.modules.auth;

import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class TenantRegistrationController {

    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerTenant(@RequestBody RegistrationRequest request) {
        // 1. Sanitize and validate tenant ID
        if (request.getTenantId() == null || request.getTenantId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("ID Apotek wajib diisi"));
        }
        
        String tenantId = request.getTenantId().trim().toLowerCase().replaceAll("[^a-z0-9_-]", "");
        if (tenantId.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("ID Apotek hanya boleh berisi huruf kecil, angka, strip, atau underscore"));
        }

        if (tenantRepository.existsById(tenantId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("ID Apotek '" + tenantId + "' sudah digunakan. Silakan pilih ID lain."));
        }

        // 2. Check if username or email already exists
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username wajib diisi"));
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username '" + request.getUsername() + "' sudah digunakan."));
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email wajib diisi"));
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email '" + request.getEmail() + "' sudah terdaftar."));
        }

        // 3. Create Tenant
        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .name(request.getTenantName() != null ? request.getTenantName() : "Apotek Baru")
                .active(true)
                .billingStatus("PENDING") // PENDING until confirmed/activated by Super Admin
                .build();
        tenantRepository.save(tenant);

        // 4. Create default Branch for this tenant
        Branch branch = new Branch();
        branch.setName("Cabang Utama");
        branch.setAddress(request.getAddress() != null ? request.getAddress() : "Alamat Pusat");
        branch.setPhone(request.getPhone() != null ? request.getPhone() : "-");
        branch.setActive(true);
        branch.setTenantId(tenantId); // Set manually
        branchRepository.save(branch);

        // 5. Create Owner User
        User user = User.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail().trim())
                .fullName(request.getFullName() != null ? request.getFullName() : request.getUsername())
                .role(Role.OWNER)
                .branchId(branch.getId())
                .tenantId(tenantId) // Set manually
                .build();
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Apotek '" + tenant.getName() + "' berhasil didaftarkan! Silakan login menggunakan ID Apotek dan kredensial Anda."));
    }

    @Data
    public static class RegistrationRequest {
        private String tenantId;
        private String tenantName;
        private String username;
        private String password;
        private String email;
        private String fullName;
        private String phone;
        private String address;
    }

    @Data
    @RequiredArgsConstructor
    public static class MessageResponse {
        private final String message;
    }
}
