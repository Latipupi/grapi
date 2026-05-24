package com.apotek.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findBySourceBranchIdOrDestinationBranchIdOrderByTransferDateDesc(Long sourceBranchId, Long destinationBranchId);
    List<StockTransfer> findAllByOrderByTransferDateDesc();
}
