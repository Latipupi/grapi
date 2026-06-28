package com.apotek.modules.sales;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales/returns")
@RequiredArgsConstructor
public class SalesReturnController {

    private final SalesReturnService salesReturnService;

    @GetMapping
    public List<SalesReturn> getAll(@RequestParam(required = false) Long branchId) {
        return salesReturnService.getAllReturns(branchId);
    }

    @GetMapping("/sale/{saleId}")
    public List<SalesReturn> getBySaleId(@PathVariable Long saleId) {
        return salesReturnService.getReturnsBySale(saleId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesReturn> getById(@PathVariable Long id) {
        try {
            SalesReturn salesReturn = salesReturnService.getReturnById(id);
            return ResponseEntity.ok(salesReturn);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'CASHIER', 'KASIR')")
    public ResponseEntity<?> create(@RequestBody SalesReturnService.CreateReturnRequest request) {
        try {
            SalesReturn salesReturn = salesReturnService.processReturn(request);
            return ResponseEntity.ok(salesReturn);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process sales return: " + e.getMessage());
        }
    }
}
