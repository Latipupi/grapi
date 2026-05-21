package com.apotek.modules.expenses;

import com.apotek.modules.masterdata.Branch;
import com.apotek.modules.masterdata.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BranchRepository branchRepository;

    public List<Expense> getExpensesByBranch(Long branchId) {
        return expenseRepository.findByBranchIdOrderByExpenseDateDesc(branchId);
    }

    public List<Expense> getExpensesByBranchAndDateRange(Long branchId, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByBranchIdAndDateRange(branchId, startDate, endDate);
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        Branch branch = branchRepository.findById(expense.getBranch().getId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        expense.setBranch(branch);
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}
