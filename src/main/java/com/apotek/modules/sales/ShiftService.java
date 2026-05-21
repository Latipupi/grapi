package com.apotek.modules.sales;

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
public class ShiftService {

    private final CashierShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final SaleRepository saleRepository;

    /**
     * Mendapatkan shift yang sedang aktif (status OPEN) untuk user tertentu.
     */
    public Optional<CashierShift> getActiveShift(Long userId) {
        return shiftRepository.findFirstByUserIdAndStatusOrderByStartTimeDesc(userId, "OPEN");
    }

    /**
     * Mendapatkan shift yang sedang aktif (status OPEN) untuk user tertentu di cabang tertentu.
     */
    public Optional<CashierShift> getActiveShift(Long userId, Long branchId) {
        if (branchId == null) {
            return getActiveShift(userId);
        }
        return shiftRepository.findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(userId, branchId, "OPEN");
    }

    /**
     * Membuka shift baru. Akan gagal jika user sudah memiliki shift yang terbuka.
     */
    @Transactional
    public CashierShift openShift(OpenShiftRequest request) {
        Long userId = request.getUserId();

        // Cek apakah ada shift yang sudah terbuka secara global
        Optional<CashierShift> existingShift = getActiveShift(userId);
        if (existingShift.isPresent()) {
            throw new IllegalStateException("Kasir masih memiliki shift yang aktif di cabang " + 
                    existingShift.get().getBranch().getName() + " (Shift ID: " + existingShift.get().getId() + 
                    "). Silakan tutup shift tersebut terlebih dahulu.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan"));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch tidak ditemukan"));

        CashierShift shift = CashierShift.builder()
                .user(user)
                .branch(branch)
                .startTime(LocalDateTime.now())
                .startingCash(request.getStartingCash())
                .totalSales(BigDecimal.ZERO)
                .status("OPEN")
                .build();

        return shiftRepository.save(shift);
    }

    /**
     * Menutup shift yang aktif dan mencatat kas akhir serta menghitung varians.
     */
    @Transactional
    public CashierShift closeShift(Long userId, CloseShiftRequest request) {
        CashierShift shift = getActiveShift(userId)
                .orElseThrow(() -> new IllegalStateException("Tidak ada shift aktif yang ditemukan untuk user ini."));

        // Hitung total penjualan tunai selama shift ini
        BigDecimal totalCashSales = saleRepository.sumCashSalesByShiftId(shift.getId());
        if (totalCashSales == null) totalCashSales = BigDecimal.ZERO;

        BigDecimal totalAllSales = saleRepository.sumAllSalesByShiftId(shift.getId());
        if (totalAllSales == null) totalAllSales = BigDecimal.ZERO;

        // Ekspektasi kas = Modal Awal + Total Penjualan Tunai
        BigDecimal expectedEndingCash = shift.getStartingCash().add(totalCashSales);

        shift.setEndTime(LocalDateTime.now());
        shift.setEndingCash(request.getEndingCash());
        shift.setExpectedEndingCash(expectedEndingCash);
        shift.setTotalSales(totalAllSales);
        shift.setStatus("CLOSED");

        return shiftRepository.save(shift);
    }

    /**
     * Mendapatkan semua shift (untuk halaman admin/laporan).
     */
    public List<CashierShift> getAllShifts() {
        return shiftRepository.findAll();
    }

    // DTO: Request untuk membuka shift
    public static class OpenShiftRequest {
        private Long userId;
        private Long branchId;
        private BigDecimal startingCash;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public BigDecimal getStartingCash() { return startingCash; }
        public void setStartingCash(BigDecimal startingCash) { this.startingCash = startingCash; }
    }

    // DTO: Request untuk menutup shift
    public static class CloseShiftRequest {
        private BigDecimal endingCash;

        public BigDecimal getEndingCash() { return endingCash; }
        public void setEndingCash(BigDecimal endingCash) { this.endingCash = endingCash; }
    }
}
