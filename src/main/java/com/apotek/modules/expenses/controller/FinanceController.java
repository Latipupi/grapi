package com.apotek.modules.expenses.controller;
import com.apotek.modules.expenses.model.*;
import com.apotek.modules.expenses.repository.*;
import com.apotek.modules.expenses.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/profit-loss")
    public FinanceService.ProfitLossReport getProfitLoss(
            @RequestParam(required = false) Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String capitalMode,
            @RequestParam(required = false) BigDecimal manualCapital) {
        return financeService.getProfitLossReport(branchId, startDate, endDate, capitalMode, manualCapital);
    }

    @PutMapping("/capital")
    public Map<String, Object> updateCapitalSettings(
            @RequestBody FinanceService.CapitalSettingsRequest request) {
        return financeService.updateCapitalSettings(request);
    }
}
