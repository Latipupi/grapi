package com.apotek.modules.masterdata;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final BranchRepository branchRepository;
    private final com.apotek.modules.inventory.InventoryService inventoryService;

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<List<Product>> bulkCreate(
            @RequestBody List<ProductImportDTO> dtos,
            @RequestParam(required = false) Long branchId) {
        
        List<Product> productsToSave = dtos.stream().map(dto -> {
            Product product = new Product();
            product.setName(dto.getName());
            product.setSku(dto.getSku());
            product.setBarcode(dto.getBarcode());
            product.setDescription(dto.getDescription());
            product.setActive(true);

            if (dto.getCategoryName() != null && !dto.getCategoryName().isBlank()) {
                Category category = categoryRepository.findByName(dto.getCategoryName())
                        .orElseGet(() -> {
                            Category newCat = new Category();
                            newCat.setName(dto.getCategoryName());
                            return categoryRepository.save(newCat);
                        });
                product.setCategory(category);
            }

            if (dto.getSupplierName() != null && !dto.getSupplierName().isBlank()) {
                Supplier supplier = supplierRepository.findByName(dto.getSupplierName())
                        .orElseGet(() -> {
                            Supplier newSup = new Supplier();
                            newSup.setName(dto.getSupplierName());
                            return supplierRepository.save(newSup);
                        });
                product.setSupplier(supplier);
            }

            if (dto.getUnits() != null) {
                for (ProductImportDTO.UnitDTO unitDto : dto.getUnits()) {
                    ProductUnit unit = new ProductUnit();
                    unit.setUnitName(unitDto.getUnitName());
                    unit.setPricePerUnit(unitDto.getPricePerUnit());
                    unit.setConversionToBase(unitDto.getConversionToBase());
                    unit.setBaseUnit(unitDto.isBaseUnit());
                    product.addUnit(unit);
                }
            }

            return product;
        }).toList();

        List<Product> savedProducts = productRepository.saveAll(productsToSave);

        // Record initial stock if provided
        if (branchId != null) {
            String importRef = "IMPORT-DATA-" + java.time.LocalDate.now().toString();
            for (int i = 0; i < dtos.size(); i++) {
                ProductImportDTO dto = dtos.get(i);
                if (dto.getInitialStock() != null && dto.getInitialStock().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    Product savedProduct = savedProducts.get(i);
                    inventoryService.recordMovement(
                            branchId,
                            savedProduct.getId(),
                            "ADJUSTMENT",
                            dto.getInitialStock(),
                            "INITIAL",
                            null,
                            importRef,
                            "Saldo awal dari import produk: " + savedProduct.getName() + (dto.getSupplierName() != null ? " (Supplier: " + dto.getSupplierName() + ")" : ""),
                            null
                    );
                }
            }
        }

        return ResponseEntity.ok(savedProducts);
    }

    @GetMapping
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Product create(@RequestBody Product product) {
        if (product.getCategoryId() != null) {
            categoryRepository.findById(product.getCategoryId()).ifPresent(product::setCategory);
        }
        
        if (product.getUnits() != null) {
            product.getUnits().forEach(unit -> unit.setProduct(product));
        }
        return productRepository.save(product);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product details) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(details.getName());
                    product.setSku(details.getSku());
                    product.setBarcode(details.getBarcode());
                    product.setDescription(details.getDescription());
                    product.setActive(details.isActive());
                    
                    if (details.getCategoryId() != null) {
                        categoryRepository.findById(details.getCategoryId()).ifPresent(product::setCategory);
                    } else {
                        product.setCategory(null);
                    }
                    
                    // Update units - simple replacement for MVP
                    if (details.getUnits() != null) {
                        product.getUnits().clear();
                        details.getUnits().forEach(unit -> {
                            unit.setProduct(product);
                            product.getUnits().add(unit);
                        });
                    }
                    
                    return ResponseEntity.ok(productRepository.save(product));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    productRepository.delete(product);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
