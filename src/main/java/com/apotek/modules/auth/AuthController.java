package com.apotek.modules.auth;

import com.apotek.core.security.JwtService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new MessageResponse("Username atau password salah"));
        }
        
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();
                
        // Validate Tenant is active and check expiration
        var tenantOpt = tenantRepository.findById(user.getTenantId());
        String billingStatus = "ACTIVE";
        String subscriptionPlan = "FREE_TRIAL";
        String expiredAtStr = "";

        if (tenantOpt.isPresent()) {
            var tenant = tenantOpt.get();
            if (!tenant.isActive()) {
                return ResponseEntity.status(403).body(new MessageResponse("Apotek Anda dinonaktifkan. Silakan hubungi Owner/Administrator."));
            }
            
            // Check if expired
            if (!"SYSTEM".equals(tenant.getId()) && tenant.getExpiredAt() != null && tenant.getExpiredAt().isBefore(java.time.LocalDateTime.now())) {
                tenant.setBillingStatus("EXPIRED");
                tenantRepository.save(tenant);
            }
            
            billingStatus = tenant.getBillingStatus();
            subscriptionPlan = tenant.getSubscriptionPlan();
            expiredAtStr = tenant.getExpiredAt() != null ? tenant.getExpiredAt().toString() : "";
        }

        // Fetch platform admin WhatsApp from SYSTEM tenant
        String adminWhatsApp = tenantRepository.findById("SYSTEM")
                .map(Tenant::getWhatsappNumber)
                .orElse("628123456789");
        
        var jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .branchId(user.getBranchId())
                .tenantId(user.getTenantId())
                .billingStatus(billingStatus)
                .subscriptionPlan(subscriptionPlan)
                .expiredAt(expiredAtStr)
                .adminWhatsApp(adminWhatsApp)
                .build());
    }

    @Data
    @RequiredArgsConstructor
    public static class MessageResponse {
        private final String message;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String username;
        private String role;
        private String fullName;
        private Long branchId;
        private String tenantId;
        private String billingStatus;
        private String subscriptionPlan;
        private String expiredAt;
        private String adminWhatsApp;

        public AuthResponse() {}
        public AuthResponse(String token, Long userId, String username, String role, String fullName, Long branchId, String tenantId, String billingStatus, String subscriptionPlan, String expiredAt, String adminWhatsApp) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.role = role;
            this.fullName = fullName;
            this.branchId = branchId;
            this.tenantId = tenantId;
            this.billingStatus = billingStatus;
            this.subscriptionPlan = subscriptionPlan;
            this.expiredAt = expiredAt;
            this.adminWhatsApp = adminWhatsApp;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getAdminWhatsApp() { return adminWhatsApp; }
        public void setAdminWhatsApp(String adminWhatsApp) { this.adminWhatsApp = adminWhatsApp; }

        public static AuthResponseBuilder builder() { return new AuthResponseBuilder(); }

        public static class AuthResponseBuilder {
            private String token;
            private Long userId;
            private String username;
            private String role;
            private String fullName;
            private Long branchId;
            private String tenantId;
            private String billingStatus;
            private String subscriptionPlan;
            private String expiredAt;
            private String adminWhatsApp;
            public AuthResponseBuilder token(String token) { this.token = token; return this; }
            public AuthResponseBuilder userId(Long userId) { this.userId = userId; return this; }
            public AuthResponseBuilder username(String username) { this.username = username; return this; }
            public AuthResponseBuilder role(String role) { this.role = role; return this; }
            public AuthResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }
            public AuthResponseBuilder branchId(Long branchId) { this.branchId = branchId; return this; }
            public AuthResponseBuilder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
            public AuthResponseBuilder billingStatus(String billingStatus) { this.billingStatus = billingStatus; return this; }
            public AuthResponseBuilder subscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; return this; }
            public AuthResponseBuilder expiredAt(String expiredAt) { this.expiredAt = expiredAt; return this; }
            public AuthResponseBuilder adminWhatsApp(String adminWhatsApp) { this.adminWhatsApp = adminWhatsApp; return this; }
            public AuthResponse build() { return new AuthResponse(token, userId, username, role, fullName, branchId, tenantId, billingStatus, subscriptionPlan, expiredAt, adminWhatsApp); }
        }
    }

    public static class LoginRequest {
        private String username;
        private String password;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
