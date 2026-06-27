package com.apotek.modules.purchasing;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
public class PurchasingController {

    private final PurchasingService purchasingService;

    @GetMapping
    public List<Purchase> getAll(@RequestParam(required = false) Long branchId) {
        if (branchId != null) {
            return purchasingService.getByBranch(branchId);
        }
        return purchasingService.getAll();
    }

    @GetMapping("/{id}")
    public Purchase getById(@PathVariable Long id) {
        return purchasingService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public Purchase create(@RequestBody Purchase purchase) {
        return purchasingService.createPurchase(purchase);
    }

    @PutMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public Purchase receive(@PathVariable Long id, @RequestBody Purchase purchase) {
        return purchasingService.receivePurchase(id, purchase);
    }
}
