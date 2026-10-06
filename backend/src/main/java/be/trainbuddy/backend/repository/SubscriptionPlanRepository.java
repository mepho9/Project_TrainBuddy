package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository
        extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByCode(
            String code
    );
}