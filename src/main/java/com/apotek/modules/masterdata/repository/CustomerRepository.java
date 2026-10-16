package com.apotek.modules.masterdata.repository;

import com.apotek.modules.masterdata.dto.CustomerSpendingDTO;
import com.apotek.modules.masterdata.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT new com.apotek.modules.masterdata.dto.CustomerSpendingDTO(" +
           "c.id, c.name, c.phone, c.address, c.email, c.active, " +
           "COUNT(s.id), " +
           "COALESCE(SUM(s.totalAmount), 0), " +
           "MIN(s.saleDate), " +
           "MAX(s.saleDate)) " +
           "FROM Customer c " +
           "JOIN Sale s ON s.customer.id = c.id " +
           "WHERE s.status = 'COMPLETED' " +
           "AND (:branchId IS NULL OR s.branch.id = :branchId) " +
           "AND s.saleDate >= :startDate AND s.saleDate <= :endDate " +
           "GROUP BY c.id, c.name, c.phone, c.address, c.email, c.active " +
           "ORDER BY SUM(s.totalAmount) DESC")
    List<CustomerSpendingDTO> findCustomerSpendingSummary(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
