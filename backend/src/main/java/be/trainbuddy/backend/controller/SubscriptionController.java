package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.CheckoutSessionResponse;
import be.trainbuddy.backend.dto.SubscriptionStatusResponse;
import be.trainbuddy.backend.entity.SubscriptionPlan;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.entity.UserSubscription;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.service.StripeService;
import be.trainbuddy.backend.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(
        name = "Premium",
        description = "Abonnement Premium TrainBuddy"
)
public class SubscriptionController {

    private final SubscriptionService
            subscriptionService;

    private final StripeService
            stripeService;

    @GetMapping("/me")
    @Operation(
            summary = "Consulter mon abonnement"
    )
    public SubscriptionStatusResponse
    getMySubscription(

            @AuthenticationPrincipal
            User currentUser

    ) {

        return subscriptionService
                .getStatus(
                        currentUser
                );
    }

    @PostMapping("/checkout")
    @Operation(
            summary = "Créer un Checkout Stripe Premium"
    )
    public CheckoutSessionResponse
    createCheckout(

            @AuthenticationPrincipal
            User currentUser

    ) {

        if (
                subscriptionService
                        .isPremium(
                                currentUser
                        )
        ) {

            throw new ConflictException(
                    "Votre abonnement Premium est déjà actif"
            );
        }

        SubscriptionPlan premiumPlan =
                subscriptionService
                        .getPremiumPlan();

        String url =
                stripeService
                        .createPremiumCheckout(

                                currentUser,

                                premiumPlan
                        );

        return new CheckoutSessionResponse(
                url
        );
    }

    @PostMapping("/cancel")
    @Operation(
            summary = "Annuler Premium à la fin de la période en cours"
    )
    public SubscriptionStatusResponse
    cancelSubscription(

            @AuthenticationPrincipal
            User currentUser

    ) {

        UserSubscription subscription =
                subscriptionService
                        .requireCancellableSubscription(
                                currentUser
                        );

        stripeService
                .scheduleCancellation(
                        subscription
                );

        subscriptionService
                .markCancellationScheduled(
                        subscription
                );

        return subscriptionService
                .getStatus(
                        currentUser
                );
    }
}