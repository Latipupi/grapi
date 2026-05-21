package com.apotek.core.config;

import com.apotek.modules.auth.Role;
import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchRepository branchRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@apotek.com")
                        .fullName("Administrator")
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println("Default admin user created: admin / admin123");
            }
            
            // Print all branches for diagnostic purposes
            List<Branch> branches = branchRepository.findAll();
            System.out.println("DIAGNOSTIC: Existing branches in database: " + branches.size());
            for (Branch b : branches) {
                System.out.println("DIAGNOSTIC: Branch ID: " + b.getId() + ", Name: " + b.getName() + ", Active: " + b.isActive());
            }
            
            // Print all users for diagnostic purposes
            List<User> users = userRepository.findAll();
            System.out.println("DIAGNOSTIC: Existing users in database: " + users.size());
            for (User u : users) {
                System.out.println("DIAGNOSTIC: User ID: " + u.getId() + ", Username: " + u.getUsername() + ", Role: " + u.getRole() + ", Branch ID: " + u.getBranchId());
            }
        };
    }
}

