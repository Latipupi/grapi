package com.apotek.modules.sales;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;
    private final SaleRepository saleRepository;

    @GetMapping
    public List<Sale> getAll(@RequestParam(required = false) Long branchId) {
        if (branchId != null) {
            return saleRepository.findByBranchIdOrderBySaleDateDesc(branchId);
        }
        return saleRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'CASHIER', 'KASIR')")
    public ResponseEntity<?> create(@RequestBody SalesService.CreateSaleRequest request) {
        try {
            Sale sale = salesService.processSale(request);
            return ResponseEntity.ok(sale);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process sale: " + e.getMessage());
        }
    }
}
