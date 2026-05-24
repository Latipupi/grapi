package com.apotek.core.config;

import com.apotek.modules.auth.Role;
import com.apotek.modules.auth.Tenant;
import com.apotek.modules.auth.TenantRepository;
import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchRepository branchRepository;
    private final TenantRepository tenantRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // 1. Check / Create tenant SYSTEM jika belum ada
            if (tenantRepository.findById("SYSTEM").isEmpty()) {
                Tenant tenant = Tenant.builder()
                        .id("SYSTEM")
                        .name("SYSTEM")
                        .subscriptionPlan("PRO_UNLIMITED")
                        .billingStatus("ACTIVE")
                        .expiredAt(LocalDateTime.parse("2126-05-24T00:00:00"))
                        .maxUsers(9999)
                        .maxBranches(9999)
                        .price(java.math.BigDecimal.ZERO)
                        .whatsappNumber("6285221081755")
                        .build();
                tenantRepository.save(tenant);
                System.out.println("Default tenant created: SYSTEM");
            } else {
                // Update nomor WhatsApp ke nomor baru Anda jika masih menggunakan nomor bawaan lama
                Tenant systemTenant = tenantRepository.findById("SYSTEM").get();
                if ("628123456789".equals(systemTenant.getWhatsappNumber())) {
                    systemTenant.setWhatsappNumber("6285221081755");
                    tenantRepository.save(systemTenant);
                    System.out.println("Updated SYSTEM tenant default WhatsApp number to: 6285221081755");
                }
            }

            // 2. Check / Create user admin secara independen
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .username("admin")
                        .tenantId("SYSTEM")
                        .password(passwordEncoder.encode("gr4p!1122334455"))
                        .email("admin@apotek.com")
                        .fullName("Administrator")
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println("Default admin user created with password gr4p!1122334455");
            }

            // Print all branches for diagnostic purposes
            List<Branch> branches = branchRepository.findAll();
            System.out.println("DIAGNOSTIC: Existing branches in database: " + branches.size());
            for (Branch b : branches) {
                System.out.println(
                        "DIAGNOSTIC: Branch ID: " + b.getId() + ", Name: " + b.getName() + ", Active: " + b.isActive());
            }

            // Print all users for diagnostic purposes
            List<User> users = userRepository.findAll();
            System.out.println("DIAGNOSTIC: Existing users in database: " + users.size());
            for (User u : users) {
                System.out.println("DIAGNOSTIC: User ID: " + u.getId() + ", Username: " + u.getUsername() + ", Role: "
                        + u.getRole() + ", Branch ID: " + u.getBranchId());
            }
        };
    }
}
