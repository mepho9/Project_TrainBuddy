package be.trainbuddy.backend.config;

import be.trainbuddy.backend.entity.SubscriptionPlan;
import be.trainbuddy.backend.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SubscriptionPlanInitializer
        implements CommandLineRunner {

    private final SubscriptionPlanRepository
            planRepository;

    @Override
    @Transactional
    public void run(
            String... args
    ) {

        upsertStandard();

        upsertPremium();
    }

    private void upsertStandard() {

        SubscriptionPlan plan =
                planRepository
                        .findByCode(
                                "STANDARD"
                        )
                        .orElseGet(
                                SubscriptionPlan::new
                        );

        plan.setCode(
                "STANDARD"
        );

        plan.setName(
                "TrainBuddy Standard"
        );

        plan.setPriceCents(
                0
        );

        plan.setCurrency(
                "EUR"
        );

        plan.setBillingInterval(
                "NONE"
        );

        plan.setMaxActiveSessions(
                2
        );

        plan.setMaxCapacity(
                5
        );

        plan.setAdvancedFilters(
                false
        );

        plan.setHighlightedSessions(
                false
        );

        plan.setActive(
                true
        );

        planRepository.save(plan);
    }

    private void upsertPremium() {

        SubscriptionPlan plan =
                planRepository
                        .findByCode(
                                "PREMIUM"
                        )
                        .orElseGet(
                                SubscriptionPlan::new
                        );

        plan.setCode(
                "PREMIUM"
        );

        plan.setName(
                "TrainBuddy Premium"
        );

        /*
         * 4,99 €
         */
        plan.setPriceCents(
                499
        );

        plan.setCurrency(
                "EUR"
        );

        plan.setBillingInterval(
                "MONTH"
        );

        plan.setMaxActiveSessions(
                10
        );

        plan.setMaxCapacity(
                12
        );

        plan.setAdvancedFilters(
                true
        );

        plan.setHighlightedSessions(
                true
        );

        plan.setActive(
                true
        );

        planRepository.save(plan);
    }
}