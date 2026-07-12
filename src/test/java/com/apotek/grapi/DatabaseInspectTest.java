package com.apotek.grapi;
 
import com.apotek.modules.sales.SalesService;
import com.apotek.modules.sales.Sale;
import com.apotek.core.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
 
@SpringBootTest
public class DatabaseInspectTest {
 
    @Autowired
    private SalesService salesService;
 
    @Autowired
    private JdbcTemplate jdbcTemplate;
 
    @Autowired
    private ObjectMapper objectMapper;
 
    @Test
    @Transactional
    public void inspectSaleSerialization() throws Exception {
        TenantContext.setCurrentTenant("SYSTEM");
 
        // 1. Fetch unit ID of AMOXILIN (product ID 4)
        Long unitId = jdbcTemplate.queryForObject(
                "SELECT id FROM product_units WHERE product_id = 4 AND is_base_unit = true LIMIT 1",
                Long.class
        );
 
        // 2. Fetch or create open cashier shift for user 1 at branch 1
        List<Map<String, Object>> shifts = jdbcTemplate.queryForList(
                "SELECT id FROM cashier_shifts WHERE user_id = 1 AND branch_id = 1 AND status = 'OPEN'"
        );
        if (shifts.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO cashier_shifts (user_id, branch_id, status, starting_cash, tenant_id, start_time) VALUES (?, ?, ?, ?, ?, ?)",
                    1L, 1L, "OPEN", new BigDecimal("50000.00"), "SYSTEM", java.time.LocalDateTime.now()
            );
        }
 
        // 3. Build CreateSaleRequest
        SalesService.CreateSaleRequest request = new SalesService.CreateSaleRequest();
        request.setBranchId(1L); // Apotek Sela Farma
        request.setUserId(1L); // Admin user
        request.setPaymentMethod("CASH");
 
        SalesService.CartItem item = new SalesService.CartItem();
        item.setProductId(4L); // AMOXILIN
        item.setUnitId(unitId);
        item.setQuantity(new BigDecimal("2.00"));
        item.setUnitPrice(new BigDecimal("5000.00"));
        request.setItems(List.of(item));
 
        System.out.println("=== PROCESSING SALE ===");
        Sale sale = salesService.processSale(request);
 
        System.out.println("=== SERIALIZING SALE TO JSON ===");
        String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(sale);
        System.out.println(json);
    }

    @Test
    @Transactional
    public void testSaleUnitFallback() throws Exception {
        TenantContext.setCurrentTenant("SYSTEM");

        // 1. Fetch unit ID and price of AMOXILIN (product ID 4)
        Map<String, Object> unitInfo = jdbcTemplate.queryForMap(
                "SELECT id, price_per_unit FROM product_units WHERE product_id = 4 AND is_base_unit = true LIMIT 1"
        );
        BigDecimal unitPrice = (BigDecimal) unitInfo.get("price_per_unit");

        // 2. Fetch or create open cashier shift for user 1 at branch 1
        List<Map<String, Object>> shifts = jdbcTemplate.queryForList(
                "SELECT id FROM cashier_shifts WHERE user_id = 1 AND branch_id = 1 AND status = 'OPEN'"
        );
        if (shifts.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO cashier_shifts (user_id, branch_id, status, starting_cash, tenant_id, start_time) VALUES (?, ?, ?, ?, ?, ?)",
                    1L, 1L, "OPEN", new BigDecimal("50000.00"), "SYSTEM", java.time.LocalDateTime.now()
            );
        }

        // 3. Build CreateSaleRequest with an INVALID unit ID but the matching unit price
        SalesService.CreateSaleRequest request = new SalesService.CreateSaleRequest();
        request.setBranchId(1L);
        request.setUserId(1L);
        request.setPaymentMethod("CASH");

        SalesService.CartItem item = new SalesService.CartItem();
        item.setProductId(4L); // AMOXILIN
        item.setUnitId(999999L); // Invalid unit ID
        item.setQuantity(new BigDecimal("1.00"));
        item.setUnitPrice(unitPrice); // Valid price to trigger fallback matching
        request.setItems(List.of(item));

        System.out.println("=== PROCESSING SALE WITH UNIT FALLBACK ===");
        Sale sale = salesService.processSale(request);
        
        org.junit.jupiter.api.Assertions.assertNotNull(sale);
        org.junit.jupiter.api.Assertions.assertFalse(sale.getDetails().isEmpty());
        com.apotek.modules.sales.SaleDetail detail = sale.getDetails().iterator().next();
        org.junit.jupiter.api.Assertions.assertNotNull(detail.getProduct());
        System.out.println("Fallback successfully processed for product: " + detail.getProduct().getName() + 
                " with conversion factor: " + detail.getConversionFactor());
    }
}
