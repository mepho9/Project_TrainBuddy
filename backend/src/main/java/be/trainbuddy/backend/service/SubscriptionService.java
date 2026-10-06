package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.SubscriptionStatusResponse;
import be.trainbuddy.backend.entity.Payment;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.SubscriptionPlan;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.entity.UserSubscription;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.PaymentRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.SubscriptionPlanRepository;
import be.trainbuddy.backend.repository.UserRepository;
import be.trainbuddy.backend.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionPlanRepository
            planRepository;

    private final UserSubscriptionRepository
            subscriptionRepository;

    private final PaymentRepository
            paymentRepository;

    private final UserRepository
            userRepository;

    private final SessionParticipantRepository
            participantRepository;

    /*
     * =========================
     * STATUT DE L'ABONNEMENT
     * =========================
     */

    @Transactional
    public SubscriptionStatusResponse getStatus(
            User user
    ) {

        UserSubscription subscription =
                subscriptionRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElse(null);

        /*
         * Si une annulation était programmée
         * et que la période Premium est maintenant
         * dépassée, le compte repasse en Standard.
         */
        if (
                subscription != null
                        && subscription.isCancelAtPeriodEnd()
                        && subscription.getCurrentPeriodEnd() != null
                        && !subscription
                        .getCurrentPeriodEnd()
                        .isAfter(
                                LocalDateTime.now()
                        )
                        && "ACTIVE".equalsIgnoreCase(
                        subscription.getStatus()
                )
        ) {

            subscription.setStatus(
                    "EXPIRED"
            );

            subscription.setUpdatedAt(
                    LocalDateTime.now()
            );

            subscriptionRepository.save(
                    subscription
            );
        }

        SubscriptionPlan effectivePlan =
                getEffectivePlan(
                        user
                );

        boolean premium =
                "PREMIUM".equals(
                        effectivePlan.getCode()
                );

        String status =
                premium
                        && subscription != null
                        ? subscription.getStatus()
                        : "STANDARD";

        /*
         * Nouveau :
         *
         * Le backend calcule lui-même combien
         * de sessions actives ont été créées
         * par ce membre.
         *
         * Le frontend ne devine donc jamais
         * lui-même ce compteur.
         */
        int activeCreatedSessions =
                countActiveCreatedSessions(
                        user
                );

        return new SubscriptionStatusResponse(

                effectivePlan.getCode(),

                effectivePlan.getName(),

                premium,

                status,

                effectivePlan.getPriceCents(),

                effectivePlan.getCurrency(),

                effectivePlan.getMaxActiveSessions(),

                activeCreatedSessions,

                effectivePlan.getMaxCapacity(),

                effectivePlan.isAdvancedFilters(),

                effectivePlan.isHighlightedSessions(),

                premium
                        && subscription != null
                        ? subscription
                          .getCurrentPeriodEnd()
                        : null,

                premium
                        && subscription != null
                        && subscription
                        .isCancelAtPeriodEnd()
        );
    }

    /*
     * =========================
     * PLAN EFFECTIF
     * =========================
     */

    @Transactional(readOnly = true)
    public SubscriptionPlan getEffectivePlan(
            User user
    ) {

        if (
                user != null
                        && isPremium(
                        user
                )
        ) {

            return getPlan(
                    "PREMIUM"
            );
        }

        return getPlan(
                "STANDARD"
        );
    }

    @Transactional(readOnly = true)
    public boolean isPremium(
            User user
    ) {

        if (user == null) {
            return false;
        }

        return subscriptionRepository
                .findByUserId(
                        user.getId()
                )
                .filter(subscription ->
                        "PREMIUM".equals(
                                subscription
                                        .getPlan()
                                        .getCode()
                        )
                )
                .filter(subscription ->
                        "ACTIVE".equalsIgnoreCase(
                                subscription
                                        .getStatus()
                        )
                )
                .filter(subscription ->
                        subscription
                                .getCurrentPeriodEnd()
                                == null

                                || subscription
                                .getCurrentPeriodEnd()
                                .isAfter(
                                        LocalDateTime.now()
                                )
                )
                .isPresent();
    }

    @Transactional(readOnly = true)
    public Set<UUID> findPremiumUserIds(
            Collection<UUID> userIds
    ) {

        if (
                userIds == null
                        || userIds.isEmpty()
        ) {
            return Set.of();
        }

        return new HashSet<>(
                subscriptionRepository
                        .findPremiumUserIds(
                                userIds,
                                LocalDateTime.now()
                        )
        );
    }

    @Transactional(readOnly = true)
    public SubscriptionPlan getPremiumPlan() {

        return getPlan(
                "PREMIUM"
        );
    }

    /*
     * =========================
     * COMPTEUR DE SESSIONS
     * =========================
     */

    @Transactional(readOnly = true)
    public int countActiveCreatedSessions(
            User user
    ) {

        LocalDateTime now =
                LocalDateTime.now();

        return Math.toIntExact(
                participantRepository
                        .findActiveByUserIdWithSession(
                                user.getId()
                        )
                        .stream()

                        /*
                         * Seulement les sessions dont
                         * le membre est le créateur.
                         */
                        .filter(
                                SessionParticipant::isCreator
                        )

                        /*
                         * Une session annulée ou déjà
                         * marquée terminée ne compte plus.
                         */
                        .filter(participant ->
                                "UPCOMING".equalsIgnoreCase(
                                        participant
                                                .getSession()
                                                .getStatus()
                                )
                        )

                        /*
                         * Sécurité supplémentaire :
                         *
                         * même si le statut DB n'a pas
                         * encore été rafraîchi, une
                         * session dont l'heure de fin
                         * est passée ne compte plus.
                         */
                        .filter(participant -> {

                            LocalDateTime endAt =
                                    participant
                                            .getSession()
                                            .getStartAt()
                                            .plusMinutes(
                                                    participant
                                                            .getSession()
                                                            .getDurationMin()
                                            );

                            return endAt.isAfter(
                                    now
                            );
                        })

                        .count()
        );
    }

    /*
     * =========================
     * ANNULATION PREMIUM
     * =========================
     */

    @Transactional(readOnly = true)
    public UserSubscription
    requireCancellableSubscription(
            User user
    ) {

        UserSubscription subscription =
                subscriptionRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "Vous n'avez pas d'abonnement Premium actif"
                                )
                        );

        if (
                !"PREMIUM".equals(
                        subscription
                                .getPlan()
                                .getCode()
                )
                        || !"ACTIVE"
                        .equalsIgnoreCase(
                                subscription.getStatus()
                        )
        ) {

            throw new BadRequestException(
                    "Vous n'avez pas d'abonnement Premium actif"
            );
        }

        if (
                subscription
                        .getStripeSubscriptionId()
                        == null
                        || subscription
                        .getStripeSubscriptionId()
                        .isBlank()
        ) {

            throw new BadRequestException(
                    "L'abonnement Stripe est introuvable"
            );
        }

        if (
                subscription
                        .isCancelAtPeriodEnd()
        ) {

            throw new BadRequestException(
                    "L'annulation de votre abonnement est déjà programmée"
            );
        }

        return subscription;
    }

    @Transactional
    public void markCancellationScheduled(
            UserSubscription subscription
    ) {

        subscription.setCancelAtPeriodEnd(
                true
        );

        subscription.setUpdatedAt(
                LocalDateTime.now()
        );

        subscriptionRepository.save(
                subscription
        );
    }

    /*
     * =========================
     * ACTIVATION STRIPE
     * =========================
     */

    @Transactional
    public void activatePremiumFromCheckout(

            UUID userId,

            String stripeCustomerId,

            String stripeSubscriptionId,

            Long amountTotal,

            String currency,

            String checkoutSessionId

    ) {

        User user =
                userRepository
                        .findById(
                                userId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Utilisateur associé au paiement introuvable"
                                )
                        );

        SubscriptionPlan premium =
                getPlan(
                        "PREMIUM"
                );

        UserSubscription subscription =
                subscriptionRepository
                        .findByUserId(
                                userId
                        )
                        .orElseGet(() ->
                                UserSubscription
                                        .builder()
                                        .user(user)
                                        .build()
                        );

        LocalDateTime now =
                LocalDateTime.now();

        subscription.setUser(
                user
        );

        subscription.setPlan(
                premium
        );

        subscription.setStatus(
                "ACTIVE"
        );

        subscription.setProvider(
                "STRIPE"
        );

        subscription.setStripeCustomerId(
                stripeCustomerId
        );

        subscription.setStripeSubscriptionId(
                stripeSubscriptionId
        );

        subscription.setStartedAt(
                now
        );

        subscription.setCurrentPeriodEnd(
                now.plusMonths(1)
        );

        subscription.setCancelAtPeriodEnd(
                false
        );

        subscription.setCancelledAt(
                null
        );

        subscription.setUpdatedAt(
                now
        );

        UserSubscription saved =
                subscriptionRepository.save(
                        subscription
                );

        /*
         * Le webhook Stripe peut être envoyé
         * plusieurs fois.
         *
         * externalPaymentId unique évite
         * les doublons dans payments.
         */
        if (
                checkoutSessionId != null
                        && !paymentRepository
                        .existsByExternalPaymentId(
                                checkoutSessionId
                        )
        ) {

            Payment payment =
                    Payment.builder()

                            .user(
                                    user
                            )

                            .subscription(
                                    saved
                            )

                            .amountCents(
                                    amountTotal != null
                                            ? amountTotal
                                            : premium
                                              .getPriceCents()
                            )

                            .currency(
                                    currency != null
                                            ? currency
                                              .toUpperCase()
                                            : premium
                                              .getCurrency()
                            )

                            .provider(
                                    "STRIPE"
                            )

                            .status(
                                    "PAID"
                            )

                            .externalPaymentId(
                                    checkoutSessionId
                            )

                            .createdAt(
                                    now
                            )

                            .build();

            paymentRepository.save(
                    payment
            );
        }
    }

    /*
     * =========================
     * SYNCHRONISATION STRIPE
     * =========================
     */

    @Transactional
    public void syncStripeSubscription(
            com.stripe.model.Subscription
                    stripeSubscription
    ) {

        UserSubscription subscription =
                subscriptionRepository
                        .findByStripeSubscriptionId(
                                stripeSubscription.getId()
                        )
                        .orElse(null);

        /*
         * Un événement subscription.created
         * peut arriver avant
         * checkout.session.completed.
         *
         * Dans ce cas, l'événement Checkout
         * créera l'abonnement local ensuite.
         */
        if (subscription == null) {
            return;
        }

        LocalDateTime now =
                LocalDateTime.now();

        String mappedStatus =
                mapStripeStatus(
                        stripeSubscription
                                .getStatus()
                );

        subscription.setStatus(
                mappedStatus
        );

        subscription.setStripeCustomerId(
                stripeSubscription
                        .getCustomer()
        );

        subscription.setCancelAtPeriodEnd(
                Boolean.TRUE.equals(
                        stripeSubscription
                                .getCancelAtPeriodEnd()
                )
        );

        if (
                "ACTIVE".equals(
                        mappedStatus
                )
                        && (
                        subscription
                                .getCurrentPeriodEnd()
                                == null

                                || !subscription
                                .getCurrentPeriodEnd()
                                .isAfter(now)
                )
        ) {

            subscription.setCurrentPeriodEnd(
                    now.plusMonths(1)
            );
        }

        if (
                "CANCELLED".equals(
                        mappedStatus
                )
                        || "EXPIRED".equals(
                        mappedStatus
                )
        ) {

            subscription.setCancelledAt(
                    now
            );

            subscription.setCurrentPeriodEnd(
                    now
            );
        }

        subscription.setUpdatedAt(
                now
        );

        subscriptionRepository.save(
                subscription
        );
    }

    private String mapStripeStatus(
            String stripeStatus
    ) {

        if (stripeStatus == null) {
            return "PAST_DUE";
        }

        return switch (
                stripeStatus
                        .toLowerCase()
                ) {

            case "active",
                 "trialing" ->
                    "ACTIVE";

            case "canceled" ->
                    "CANCELLED";

            case "incomplete_expired" ->
                    "EXPIRED";

            case "past_due",
                 "unpaid",
                 "incomplete",
                 "paused" ->
                    "PAST_DUE";

            default ->
                    "PAST_DUE";
        };
    }

    private SubscriptionPlan getPlan(
            String code
    ) {

        return planRepository
                .findByCode(code)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Plan d'abonnement introuvable : "
                                        + code
                        )
                );
    }
}