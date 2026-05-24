package com.apotek.core.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void enableTenantFilter() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                if (session != null) {
                    session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
                }
            } catch (Exception e) {
                // Fail-safe: ignore if session/entitymanager is not active or ready
            }
        }
    }
}
