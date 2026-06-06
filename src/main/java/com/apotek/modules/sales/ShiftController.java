package com.apotek.modules.sales;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    /**
     * GET /api/v1/shifts/current?userId={id}&branchId={branchId}
     * Mengambil shift yang sedang aktif untuk user tertentu di cabang tertentu.
     */
    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'CASHIER')")
    public ResponseEntity<?> getCurrentShift(
            @RequestParam Long userId,
            @RequestParam(required = false) Long branchId) {
        return shiftService.getActiveShift(userId, branchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * POST /api/v1/shifts/open
     * Membuka shift baru untuk kasir.
     * Body: { userId, branchId, startingCash }
     */
    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'CASHIER')")
    public ResponseEntity<?> openShift(@RequestBody ShiftService.OpenShiftRequest request) {
        try {
            CashierShift shift = shiftService.openShift(request);
            return ResponseEntity.ok(shift);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Gagal membuka shift: " + e.getMessage());
        }
    }

    /**
     * POST /api/v1/shifts/close?userId={id}
     * Menutup shift aktif milik kasir.
     * Body: { endingCash }
     */
    @PostMapping("/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'CASHIER')")
    public ResponseEntity<?> closeShift(
            @RequestParam Long userId,
            @RequestParam(required = false) Long branchId,
            @RequestBody ShiftService.CloseShiftRequest request) {
        try {
            CashierShift shift = shiftService.closeShift(userId, branchId, request);
            return ResponseEntity.ok(shift);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Gagal menutup shift: " + e.getMessage());
        }
    }

    /**
     * GET /api/v1/shifts
     * Mengambil semua data shift (untuk admin/laporan).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public List<CashierShift> getAllShifts() {
        return shiftService.getAllShifts();
    }
}
