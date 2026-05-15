package com.apotek.modules.masterdata;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductImportDTO {
    private String name;
    private String sku;
    private String barcode;
    private String categoryName;
    private String supplierName;
    private String description;
    private BigDecimal initialStock;
    private List<UnitDTO> units;

    @Data
    public static class UnitDTO {
        private String unitName;
        private BigDecimal pricePerUnit;
        private int conversionToBase;
        private boolean baseUnit;
    }
}
