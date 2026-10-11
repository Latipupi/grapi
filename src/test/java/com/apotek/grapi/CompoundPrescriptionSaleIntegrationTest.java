package com.apotek.grapi;

import com.apotek.core.security.TenantContext;
import com.apotek.modules.auth.model.User;
import com.apotek.modules.auth.repository.UserRepository;
import com.apotek.modules.inventory.model.Inventory;
import com.apotek.modules.inventory.repository.InventoryBatchRepository;
import com.apotek.modules.inventory.repository.InventoryRepository;
import com.apotek.modules.masterdata.model.Branch;
import com.apotek.modules.masterdata.repository.BranchRepository;
import com.apotek.modules.sales.model.CashierShift;
import com.apotek.modules.sales.model.Sale;
import com.apotek.modules.sales.model.SaleDetail;
import com.apotek.modules.sales.repository.CashierShiftRepository;
import com.apotek.modules.sales.service.SalesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class CompoundPrescriptionSaleIntegrationTest {

    @Autowired
    private SalesService salesService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryBatchRepository batchRepository;

    @Autowired
    private CashierShiftRepository shiftRepository;

    @Test
    @Transactional
    public void testCompoundPrescriptionSaleProcess() {
        TenantContext.setCurrentTenant("SYSTEM");

        Long branchId = 1L;
        Long productId = 4L; // AMOXILIN

        User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new AssertionError("Admin user not found"));

        // Ensure an open cashier shift exists for the test
        CashierShift shift = shiftRepository.findFirstByUserIdAndBranchIdAndStatusOrderByStartTimeDesc(user.getId(), branchId, "OPEN")
                .orElseGet(() -> {
                    Branch branch = branchRepository.findById(branchId).orElseThrow();
                    CashierShift newShift = CashierShift.builder()
                            .user(user)
                            .branch(branch)
                            .startingCash(new BigDecimal("100000"))
                            .status("OPEN")
                            .startTime(LocalDateTime.now())
                            .tenantId("SYSTEM")
                            .build();
                    return shiftRepository.save(newShift);
                });

        Inventory inventoryBefore = inventoryRepository.findByBranchIdAndProductId(branchId, productId)
                .orElseThrow(() -> new AssertionError("Inventory for product 4 not found"));
        BigDecimal stockBefore = inventoryBefore.getStockQuantity();
        assertTrue(stockBefore.compareTo(BigDecimal.ONE) >= 0, "Stock should be available for test");

        BigDecimal qtyToUse = new BigDecimal("1.0");

        // Construct compound sale request
        SalesService.CreateSaleRequest request = new SalesService.CreateSaleRequest();
        request.setBranchId(branchId);
        request.setUserId(user.getId());
        request.setPaymentMethod("CASH");

        SalesService.CartItem compoundItem = new SalesService.CartItem();
        compoundItem.setIsCompound(true);
        compoundItem.setCompoundName("Puyer Batuk Anak Racik");
        compoundItem.setPackageType("Puyer");
        compoundItem.setDoseRule("3 x 1 bungkus sesudah makan");
        compoundItem.setQuantity(new BigDecimal("10")); // 10 bungkus
        compoundItem.setServiceFee(new BigDecimal("5000")); // Jasa racik Rp 5.000

        SalesService.CompoundIngredientItem ingredient = new SalesService.CompoundIngredientItem();
        ingredient.setProductId(productId);
        ingredient.setQuantity(qtyToUse);
        ingredient.setUnitPrice(new BigDecimal("3000")); // Rp 3.000 per tablet

        List<SalesService.CompoundIngredientItem> ingredients = new ArrayList<>();
        ingredients.add(ingredient);
        compoundItem.setIngredients(ingredients);

        List<SalesService.CartItem> items = new ArrayList<>();
        items.add(compoundItem);
        request.setItems(items);

        // Execute sale
        Sale sale = salesService.processSale(request);
        assertNotNull(sale);
        assertNotNull(sale.getId());

        // Verify total amount: ingredients (1 * 3000) + service fee (5000) = 8000
        assertEquals(new BigDecimal("8000.00"), sale.getTotalAmount().setScale(2));

        // Verify sale details
        assertEquals(1, sale.getDetails().size());
        SaleDetail detail = sale.getDetails().iterator().next();
        assertTrue(detail.getIsCompound());
        assertEquals("Puyer Batuk Anak Racik", detail.getCompoundName());
        assertEquals("Puyer", detail.getPackageType());
        assertEquals("3 x 1 bungkus sesudah makan", detail.getDoseRule());
        assertEquals(new BigDecimal("5000.00"), detail.getServiceFee().setScale(2));
        assertEquals(new BigDecimal("8000.00"), detail.getSubtotal().setScale(2));
        assertEquals(1, detail.getIngredients().size());

        // Verify stock deducted
        Inventory inventoryAfter = inventoryRepository.findByBranchIdAndProductId(branchId, productId)
                .orElseThrow();
        assertEquals(stockBefore.subtract(qtyToUse).stripTrailingZeros(), inventoryAfter.getStockQuantity().stripTrailingZeros());
    }
}
