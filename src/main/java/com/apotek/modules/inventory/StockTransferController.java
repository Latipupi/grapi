package com.apotek.modules.inventory;

import com.apotek.modules.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class StockTransferController {

    private final StockTransferService stockTransferService;
    private final StockTransferRepository stockTransferRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<?> createTransfer(
            @RequestBody StockTransferService.StockTransferRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            StockTransfer transfer = stockTransferService.createTransfer(request, currentUser);
            return ResponseEntity.ok(transfer);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping
    public List<StockTransfer> getAllTransfers() {
        return stockTransferRepository.findAllByOrderByTransferDateDesc();
    }

    @GetMapping("/branch/{branchId}")
    public List<StockTransfer> getTransfersByBranch(@PathVariable Long branchId) {
        return stockTransferRepository.findBySourceBranchIdOrDestinationBranchIdOrderByTransferDateDesc(branchId, branchId);
    }

    @lombok.Data
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String message;
    }
}
