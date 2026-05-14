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
