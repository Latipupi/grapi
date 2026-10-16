package com.apotek.modules.sales.controller;
import com.apotek.modules.sales.model.*;
import com.apotek.modules.sales.repository.*;
import com.apotek.modules.sales.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;
    private final SaleRepository saleRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    @Transactional(readOnly = true)
    public List<Sale> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status
    ) {
        LocalDateTime start = parseDateTime(startDate, false);
        LocalDateTime end = parseDateTime(endDate, true);
        String stat = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) ? status : null;

        return saleRepository.findSalesWithFilters(branchId, start, end, stat);
    }

    private LocalDateTime parseDateTime(String dateStr, boolean isEnd) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr);
            }
            LocalDate ld = LocalDate.parse(dateStr);
            return isEnd ? ld.atTime(23, 59, 59, 999999999) : ld.atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<Sale> getById(@PathVariable Long id) {
        return saleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
