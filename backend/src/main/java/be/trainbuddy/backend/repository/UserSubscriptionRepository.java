package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.UserSubscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository
        extends JpaRepository<UserSubscription, UUID> {

    @EntityGraph(
            attributePaths = {
                    "plan",
                    "user"
            }
    )
    Optional<UserSubscription> findByUserId(
            UUID userId
    );

    @EntityGraph(
            attributePaths = {
                    "plan",
                    "user"
            }
    )
    Optional<UserSubscription>
    findByStripeSubscriptionId(
            String stripeSubscriptionId
    );

    /*
     * Utilisé pour déterminer en une seule
     * requête quels créateurs disposent
     * actuellement de Premium.
     */
    @Query("""
            select s.user.id
            from UserSubscription s
            where s.user.id in :userIds
              and s.plan.code = 'PREMIUM'
              and s.status = 'ACTIVE'
              and (
                    s.currentPeriodEnd is null
                    or s.currentPeriodEnd > :now
              )
            """)
    List<UUID> findPremiumUserIds(

            @Param("userIds")
            Collection<UUID> userIds,

            @Param("now")
            LocalDateTime now
    );
}