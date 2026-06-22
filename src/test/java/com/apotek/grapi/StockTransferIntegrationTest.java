package com.apotek.grapi;

import com.apotek.core.security.TenantContext;
import com.apotek.modules.auth.User;
import com.apotek.modules.auth.UserRepository;
import com.apotek.modules.inventory.*;
import com.apotek.modules.masterdata.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class StockTransferIntegrationTest {

    @Autowired
    private StockTransferService stockTransferService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryBatchRepository inventoryBatchRepository;

    @Test
    @Transactional
    public void testDoubleStockTransfer() {
        TenantContext.setCurrentTenant("SYSTEM");

        Long sourceBranchId = 1L;
        Long destinationBranchId = 2L;
        Long productId = 4L; // AMOXILIN

        User currentUser = userRepository.findByUsername("admin")
                .orElseThrow(() -> new AssertionError("Admin user not found"));

        // Get initial values
        Optional<Inventory> sourceInvOptBefore = inventoryRepository.findByBranchIdAndProductId(sourceBranchId, productId);
        assertTrue(sourceInvOptBefore.isPresent());
        BigDecimal sourceQtyBefore = sourceInvOptBefore.get().getStockQuantity();

        Optional<Inventory> destInvOptBefore = inventoryRepository.findByBranchIdAndProductId(destinationBranchId, productId);
        BigDecimal destQtyBefore = destInvOptBefore.map(Inventory::getStockQuantity).orElse(BigDecimal.ZERO);

        List<InventoryBatch> sourceBatches = inventoryBatchRepository.findByBranchIdAndProductIdOrderByExpiryDateAsc(sourceBranchId, productId);
        assertFalse(sourceBatches.isEmpty());
        InventoryBatch targetBatch = sourceBatches.get(0);
        String batchNumber = targetBatch.getBatchNumber();
        LocalDate expiryDate = targetBatch.getExpiryDate();

        BigDecimal transferQty = new BigDecimal("2.0");

        // 1. Perform first transfer
        StockTransferService.StockTransferRequest request1 = new StockTransferService.StockTransferRequest();
        request1.setSourceBranchId(sourceBranchId);
        request1.setDestinationBranchId(destinationBranchId);
        request1.setNotes("First Transfer");
        StockTransferService.TransferItemRequest item1 = new StockTransferService.TransferItemRequest();
        item1.setProductId(productId);
        item1.setQuantity(transferQty);
        item1.setBatchNumber(batchNumber);
        item1.setExpiryDate(expiryDate);
        List<StockTransferService.TransferItemRequest> items1 = new ArrayList<>();
        items1.add(item1);
        request1.setItems(items1);

        stockTransferService.createTransfer(request1, currentUser);

        // 2. Perform second transfer of the same product
        StockTransferService.StockTransferRequest request2 = new StockTransferService.StockTransferRequest();
        request2.setSourceBranchId(sourceBranchId);
        request2.setDestinationBranchId(destinationBranchId);
        request2.setNotes("Second Transfer");
        StockTransferService.TransferItemRequest item2 = new StockTransferService.TransferItemRequest();
        item2.setProductId(productId);
        item2.setQuantity(transferQty);
        item2.setBatchNumber(batchNumber);
        item2.setExpiryDate(expiryDate);
        List<StockTransferService.TransferItemRequest> items2 = new ArrayList<>();
        items2.add(item2);
        request2.setItems(items2);

        stockTransferService.createTransfer(request2, currentUser);

        // Verify final inventory of source branch (subtracted by 4.0 total)
        Optional<Inventory> sourceInvOptAfter = inventoryRepository.findByBranchIdAndProductId(sourceBranchId, productId);
        assertTrue(sourceInvOptAfter.isPresent());
        BigDecimal expectedSourceQty = sourceQtyBefore.subtract(transferQty.multiply(new BigDecimal("2")));
        assertEquals(expectedSourceQty.stripTrailingZeros(), sourceInvOptAfter.get().getStockQuantity().stripTrailingZeros());

        // Verify final inventory of destination branch (added by 4.0 total)
        Optional<Inventory> destInvOptAfter = inventoryRepository.findByBranchIdAndProductId(destinationBranchId, productId);
        assertTrue(destInvOptAfter.isPresent());
        BigDecimal expectedDestQty = destQtyBefore.add(transferQty.multiply(new BigDecimal("2")));
        assertEquals(expectedDestQty.stripTrailingZeros(), destInvOptAfter.get().getStockQuantity().stripTrailingZeros());

        // Verify no duplicate inventory rows exist for product on destination branch
        List<Inventory> allDestInv = inventoryRepository.findByBranchId(destinationBranchId);
        long count = allDestInv.stream().filter(inv -> inv.getProduct().getId().equals(productId)).count();
        assertEquals(1, count, "Product should not be duplicated in destination branch's inventory after two transfers");
    }
}
