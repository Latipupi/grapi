package com.apotek.modules.inventory;

import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StockOpnameService {

    private final StockOpnameRepository opnameRepository;
    private final StockOpnameDetailRepository opnameDetailRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Transactional
    public StockOpname createOpnameSession(Long branchId, Long userId, String type) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create new draft session
        StockOpname opname = StockOpname.builder()
                .branch(branch)
                .user(user)
                .opnameDate(LocalDateTime.now())
                .status("DRAFT")
                .notes("")
                .build();

        StockOpname savedOpname = opnameRepository.save(opname);

        // If FULL opname, pre-populate worksheet with active inventory batches
        if ("FULL".equalsIgnoreCase(type)) {
            List<InventoryBatch> activeBatches = inventoryBatchRepository.findByBranchIdOrderByExpiryDateAsc(branchId);
            for (InventoryBatch batch : activeBatches) {
                // Pre-populate only batches that currently have stock in system
                if (batch.getCurrentQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    StockOpnameDetail detail = StockOpnameDetail.builder()
                            .stockOpname(savedOpname)
                            .inventoryBatch(batch)
                            .product(batch.getProduct())
                            .systemQuantity(batch.getCurrentQuantity())
                            .physicalQuantity(batch.getCurrentQuantity())
                            .difference(BigDecimal.ZERO)
                            .reason("")
                            .build();
                    opnameDetailRepository.save(detail);
                }
            }
        }

        return savedOpname;
    }

    @Transactional
    public StockOpname addBatchToSession(Long opnameId, Long batchId) {
        StockOpname opname = opnameRepository.findById(opnameId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Opname session not found"));
        
        if (!"DRAFT".equals(opname.getStatus())) {
            throw new IllegalStateException("Cannot add items to a completed session");
        }

        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));

        if (!batch.getBranch().getId().equals(opname.getBranch().getId())) {
            throw new IllegalArgumentException("Batch does not belong to the opname's branch");
        }

        // Check if already exists in details
        boolean exists = opname.getDetails().stream()
                .anyMatch(d -> d.getInventoryBatch().getId().equals(batchId));

        if (!exists) {
            StockOpnameDetail detail = StockOpnameDetail.builder()
                    .stockOpname(opname)
                    .inventoryBatch(batch)
                    .product(batch.getProduct())
                    .systemQuantity(batch.getCurrentQuantity())
                    .physicalQuantity(batch.getCurrentQuantity())
                    .difference(BigDecimal.ZERO)
                    .reason("")
                    .build();
            opnameDetailRepository.save(detail);
        }

        return opnameRepository.save(opname);
    }

    @Transactional
    public StockOpname saveOpnameDraft(Long opnameId, List<DetailDraft> drafts, String notes) {
        StockOpname opname = opnameRepository.findById(opnameId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Opname session not found"));

        if (!"DRAFT".equals(opname.getStatus())) {
            throw new IllegalStateException("Cannot edit a completed session");
        }

        opname.setNotes(notes);

        for (DetailDraft draft : drafts) {
            StockOpnameDetail detail = opnameDetailRepository.findById(draft.getDetailId())
                    .orElseThrow(() -> new IllegalArgumentException("Opname detail not found: " + draft.getDetailId()));

            detail.setPhysicalQuantity(draft.getPhysicalQuantity());
            detail.setDifference(draft.getPhysicalQuantity().subtract(detail.getSystemQuantity()));
            detail.setReason(draft.getReason());
            opnameDetailRepository.save(detail);
        }

        return opnameRepository.save(opname);
    }

    @Transactional
    public StockOpname finalizeOpname(Long opnameId) {
        StockOpname opname = opnameRepository.findById(opnameId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Opname session not found"));

        if (!"DRAFT".equals(opname.getStatus())) {
            throw new IllegalStateException("Session is already completed");
        }

        if (opname.getDetails().isEmpty()) {
            throw new IllegalStateException("Cannot finalize an empty opname session");
        }

        String refNum = "SO-" + opname.getId();

        for (StockOpnameDetail detail : opname.getDetails()) {
            // Fetch FRESH batch quantity at exact time of finalization
            InventoryBatch batch = inventoryBatchRepository.findById(detail.getInventoryBatch().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + detail.getInventoryBatch().getId()));

            BigDecimal freshSystemQty = batch.getCurrentQuantity();
            BigDecimal physicalQty = detail.getPhysicalQuantity();
            BigDecimal finalDiff = physicalQty.subtract(freshSystemQty);

            // Update detail statistics to reflect true audit figures at finalization time
            detail.setSystemQuantity(freshSystemQty);
            detail.setDifference(finalDiff);
            opnameDetailRepository.save(detail);

            // If there's a discrepancy, trigger stock adjustments and movements
            if (finalDiff.compareTo(BigDecimal.ZERO) != 0) {
                String notes = "SO #" + opname.getId() + " - " + 
                        (detail.getReason() != null && !detail.getReason().isEmpty() ? detail.getReason() : "Penyesuaian Stok Fisik");

                if (finalDiff.compareTo(BigDecimal.ZERO) > 0) {
                    // Surplus: Record IN movement as ADJUSTMENT
                    inventoryService.recordMovement(
                            opname.getBranch().getId(),
                            detail.getProduct().getId(),
                            "ADJUSTMENT",
                            finalDiff,
                            batch.getBatchNumber(),
                            batch.getExpiryDate(),
                            refNum,
                            notes,
                            batch.getPurchasePrice()
                    );
                } else {
                    // Deficit: Record OUT movement
                    inventoryService.recordMovement(
                            opname.getBranch().getId(),
                            detail.getProduct().getId(),
                            "OUT",
                            finalDiff.abs(),
                            batch.getBatchNumber(),
                            batch.getExpiryDate(),
                            refNum,
                            notes,
                            batch.getPurchasePrice()
                    );
                }
            }
        }

        opname.setStatus("COMPLETED");
        opname.setOpnameDate(LocalDateTime.now());
        return opnameRepository.save(opname);
    }

    public static class DetailDraft {
        private Long detailId;
        private BigDecimal physicalQuantity;
        private String reason;

        public Long getDetailId() { return detailId; }
        public void setDetailId(Long detailId) { this.detailId = detailId; }
        public BigDecimal getPhysicalQuantity() { return physicalQuantity; }
        public void setPhysicalQuantity(BigDecimal physicalQuantity) { this.physicalQuantity = physicalQuantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
