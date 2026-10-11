package com.apotek.modules.masterdata.controller;

import com.apotek.modules.inventory.model.Inventory;
import com.apotek.modules.inventory.repository.InventoryRepository;
import com.apotek.modules.masterdata.model.Product;
import com.apotek.modules.masterdata.model.ProductRecommendation;
import com.apotek.modules.masterdata.repository.ProductRecommendationRepository;
import com.apotek.modules.masterdata.repository.ProductRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/product-recommendations")
@RequiredArgsConstructor
public class ProductRecommendationController {

    private final ProductRecommendationRepository recommendationRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @GetMapping
    public List<ProductRecommendation> getAll(
            @RequestParam(required = false) Long sourceProductId,
            @RequestParam(required = false) String relationType
    ) {
        if (sourceProductId != null && relationType != null && !relationType.isBlank()) {
            return recommendationRepository.findBySourceProductIdAndRelationType(sourceProductId, relationType.toUpperCase());
        }
        if (sourceProductId != null) {
            return recommendationRepository.findBySourceProductId(sourceProductId);
        }
        return recommendationRepository.findAllOrderBySourceName();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF')")
    public ResponseEntity<?> createOrUpdate(@RequestBody RecommendationRequest request) {
        if (request.getSourceProductId() == null || request.getTargetProductId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Produk sumber dan produk tujuan wajib dipilih."));
        }
        if (request.getSourceProductId().equals(request.getTargetProductId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Produk rekomendasi tidak boleh sama dengan produk utama."));
        }
        if (request.getRelationType() == null || request.getRelationType().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipe relasi (SUBSTITUTION, UP_SELLING, LINK_SELLING) wajib diisi."));
        }

        Product source = productRepository.findById(request.getSourceProductId()).orElse(null);
        Product target = productRepository.findById(request.getTargetProductId()).orElse(null);

        if (source == null || target == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Produk tidak ditemukan."));
        }

        String type = request.getRelationType().toUpperCase();
        Optional<ProductRecommendation> existing = recommendationRepository
                .findBySourceProductIdAndTargetProductIdAndRelationType(source.getId(), target.getId(), type);

        ProductRecommendation rec;
        if (existing.isPresent()) {
            rec = existing.get();
            rec.setNotes(request.getNotes());
        } else {
            rec = ProductRecommendation.builder()
                    .sourceProduct(source)
                    .targetProduct(target)
                    .relationType(type)
                    .notes(request.getNotes())
                    .build();
        }

        ProductRecommendation saved = recommendationRepository.save(rec);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!recommendationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recommendationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Rekomendasi produk berhasil dihapus."));
    }

    @GetMapping("/pos-suggestions")
    public ResponseEntity<?> getPosSuggestions(
            @RequestParam Long productId,
            @RequestParam(required = false) Long branchId
    ) {
        Product sourceProduct = productRepository.findById(productId).orElse(null);
        if (sourceProduct == null) {
            return ResponseEntity.notFound().build();
        }

        BigDecimal sourceStock = getStockForProduct(productId, branchId);

        List<ProductRecommendation> allConfigured = recommendationRepository.findBySourceProductId(productId);

        List<SuggestionItemDto> substitutions = new ArrayList<>();
        List<SuggestionItemDto> upSells = new ArrayList<>();
        List<SuggestionItemDto> linkSells = new ArrayList<>();

        Set<Long> configuredTargetIds = new HashSet<>();

        for (ProductRecommendation rec : allConfigured) {
            Product target = rec.getTargetProduct();
            if (target == null || !target.isActive()) continue;

            configuredTargetIds.add(target.getId());
            BigDecimal stock = getStockForProduct(target.getId(), branchId);

            SuggestionItemDto dto = SuggestionItemDto.builder()
                    .id(rec.getId())
                    .productId(target.getId())
                    .name(target.getName())
                    .sku(target.getSku())
                    .unit(target.getUnit())
                    .sellingPrice(target.getSellingPrice())
                    .relationType(rec.getRelationType())
                    .notes(rec.getNotes())
                    .currentStock(stock)
                    .isConfigured(true)
                    .build();

            switch (rec.getRelationType()) {
                case "SUBSTITUTION" -> substitutions.add(dto);
                case "UP_SELLING" -> upSells.add(dto);
                case "LINK_SELLING" -> linkSells.add(dto);
            }
        }

        // Smart Auto-Detect for Substitutions if source stock is low/zero or to expand options:
        // 1. By active substance (kandungan zat aktif)
        // 2. By same category
        if (sourceProduct.getActiveSubstance() != null && !sourceProduct.getActiveSubstance().isBlank()) {
            String activeSub = sourceProduct.getActiveSubstance().trim();
            List<Product> sameSubstance = productRepository.findAll().stream()
                    .filter(p -> p.isActive() && !p.getId().equals(productId) && !configuredTargetIds.contains(p.getId()))
                    .filter(p -> p.getActiveSubstance() != null && p.getActiveSubstance().equalsIgnoreCase(activeSub))
                    .toList();

            for (Product autoP : sameSubstance) {
                BigDecimal stock = getStockForProduct(autoP.getId(), branchId);
                // Prioritize items that have stock > 0 in this branch
                if (stock.compareTo(BigDecimal.ZERO) > 0) {
                    configuredTargetIds.add(autoP.getId());
                    substitutions.add(SuggestionItemDto.builder()
                            .productId(autoP.getId())
                            .name(autoP.getName())
                            .sku(autoP.getSku())
                            .unit(autoP.getUnit())
                            .sellingPrice(autoP.getSellingPrice())
                            .relationType("SUBSTITUTION")
                            .notes("Zat aktif sama: " + activeSub)
                            .currentStock(stock)
                            .isConfigured(false)
                            .build());
                }
            }
        }

        // Auto-detect by category if substitutions is still empty and category exists
        if (substitutions.isEmpty() && sourceProduct.getCategory() != null) {
            Long catId = sourceProduct.getCategory().getId();
            List<Product> sameCategory = productRepository.findAll().stream()
                    .filter(p -> p.isActive() && !p.getId().equals(productId) && !configuredTargetIds.contains(p.getId()))
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(catId))
                    .limit(5)
                    .toList();

            for (Product autoP : sameCategory) {
                BigDecimal stock = getStockForProduct(autoP.getId(), branchId);
                if (stock.compareTo(BigDecimal.ZERO) > 0) {
                    configuredTargetIds.add(autoP.getId());
                    substitutions.add(SuggestionItemDto.builder()
                            .productId(autoP.getId())
                            .name(autoP.getName())
                            .sku(autoP.getSku())
                            .unit(autoP.getUnit())
                            .sellingPrice(autoP.getSellingPrice())
                            .relationType("SUBSTITUTION")
                            .notes("Kategori sejenis: " + sourceProduct.getCategory().getName())
                            .currentStock(stock)
                            .isConfigured(false)
                            .build());
                }
            }
        }

        PosSuggestionsResponse response = PosSuggestionsResponse.builder()
                .sourceProductId(sourceProduct.getId())
                .sourceProductName(sourceProduct.getName())
                .sourceProductSku(sourceProduct.getSku())
                .sourceProductStock(sourceStock)
                .substitutions(substitutions)
                .upSells(upSells)
                .linkSells(linkSells)
                .build();

        return ResponseEntity.ok(response);
    }

    private BigDecimal getStockForProduct(Long productId, Long branchId) {
        if (branchId != null && branchId > 0) {
            return inventoryRepository.findByBranchIdAndProductId(branchId, productId)
                    .map(Inventory::getStockQuantity)
                    .orElse(BigDecimal.ZERO);
        }
        // If branchId is null/0, sum across all branches
        return inventoryRepository.findAll().stream()
                .filter(i -> i.getProduct() != null && i.getProduct().getId().equals(productId))
                .map(Inventory::getStockQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationRequest {
        private Long sourceProductId;
        private Long targetProductId;
        private String relationType; // SUBSTITUTION, UP_SELLING, LINK_SELLING
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestionItemDto {
        private Long id; // recommendation id (if configured)
        private Long productId;
        private String name;
        private String sku;
        private String unit;
        private BigDecimal sellingPrice;
        private String relationType;
        private String notes;
        private BigDecimal currentStock;
        private boolean isConfigured;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PosSuggestionsResponse {
        private Long sourceProductId;
        private String sourceProductName;
        private String sourceProductSku;
        private BigDecimal sourceProductStock;
        private List<SuggestionItemDto> substitutions;
        private List<SuggestionItemDto> upSells;
        private List<SuggestionItemDto> linkSells;
    }
}
