package com.apotek.modules.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/opnames")
@RequiredArgsConstructor
public class StockOpnameController {

    private final StockOpnameService opnameService;
    private final StockOpnameRepository opnameRepository;

    @PostMapping("/branch/{branchId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<?> startSession(
            @PathVariable Long branchId,
            @RequestParam Long userId,
            @RequestParam String type) {
        try {
            StockOpname opname = opnameService.createOpnameSession(branchId, userId, type);
            return ResponseEntity.ok(opname);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/branch/{branchId}")
    public List<StockOpname> getOpnamesByBranch(@PathVariable Long branchId) {
        return opnameRepository.findByBranchIdOrderByOpnameDateDesc(branchId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockOpname> getOpnameById(@PathVariable Long id) {
        return opnameRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/add-batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<StockOpname> addBatchToSession(
            @PathVariable Long id,
            @RequestParam Long batchId) {
        try {
            StockOpname opname = opnameService.addBatchToSession(id, batchId);
            return ResponseEntity.ok(opname);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}/save")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<StockOpname> saveDraft(
            @PathVariable Long id,
            @RequestBody SaveDraftRequest request) {
        try {
            StockOpname opname = opnameService.saveOpnameDraft(id, request.getDrafts(), request.getNotes());
            return ResponseEntity.ok(opname);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR')")
    public ResponseEntity<?> finalizeSession(@PathVariable Long id) {
        try {
            StockOpname opname = opnameService.finalizeOpname(id);
            return ResponseEntity.ok(opname);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Gagal menyelesaikan opname: " + e.getMessage());
        }
    }

    public static class SaveDraftRequest {
        private List<StockOpnameService.DetailDraft> drafts;
        private String notes;

        public List<StockOpnameService.DetailDraft> getDrafts() { return drafts; }
        public void setDrafts(List<StockOpnameService.DetailDraft> drafts) { this.drafts = drafts; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
