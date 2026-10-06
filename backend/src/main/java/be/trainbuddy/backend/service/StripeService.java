package be.trainbuddy.backend.service;

import be.trainbuddy.backend.entity.SubscriptionPlan;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.entity.UserSubscription;
import be.trainbuddy.backend.exception.BadRequestException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public String createPremiumCheckout(
            User user,
            SubscriptionPlan premiumPlan
    ) {

        ensureConfigured();

        Stripe.apiKey =
                secretKey;

        SessionCreateParams.LineItem.PriceData.Recurring
                recurring =
                SessionCreateParams
                        .LineItem
                        .PriceData
                        .Recurring
                        .builder()
                        .setInterval(
                                SessionCreateParams
                                        .LineItem
                                        .PriceData
                                        .Recurring
                                        .Interval
                                        .MONTH
                        )
                        .setIntervalCount(
                                1L
                        )
                        .build();

        SessionCreateParams.LineItem.PriceData.ProductData
                productData =
                SessionCreateParams
                        .LineItem
                        .PriceData
                        .ProductData
                        .builder()
                        .setName(
                                "TrainBuddy Premium"
                        )
                        .setDescription(
                                "Abonnement Premium TrainBuddy - 4,99 € / mois"
                        )
                        .build();

        SessionCreateParams.LineItem.PriceData
                priceData =
                SessionCreateParams
                        .LineItem
                        .PriceData
                        .builder()
                        .setCurrency(
                                premiumPlan
                                        .getCurrency()
                                        .toLowerCase()
                        )
                        .setUnitAmount(
                                (long)
                                        premiumPlan
                                                .getPriceCents()
                        )
                        .setProductData(
                                productData
                        )
                        .setRecurring(
                                recurring
                        )
                        .build();

        SessionCreateParams.LineItem
                lineItem =
                SessionCreateParams
                        .LineItem
                        .builder()
                        .setQuantity(
                                1L
                        )
                        .setPriceData(
                                priceData
                        )
                        .build();

        SessionCreateParams.SubscriptionData
                subscriptionData =
                SessionCreateParams
                        .SubscriptionData
                        .builder()
                        .putMetadata(
                                "userId",
                                user.getId()
                                        .toString()
                        )
                        .putMetadata(
                                "planCode",
                                "PREMIUM"
                        )
                        .build();

        SessionCreateParams params =
                SessionCreateParams
                        .builder()

                        .setMode(
                                SessionCreateParams
                                        .Mode
                                        .SUBSCRIPTION
                        )

                        .setCustomerEmail(
                                user.getEmail()
                        )

                        .setClientReferenceId(
                                user.getId()
                                        .toString()
                        )

                        .setSuccessUrl(
                                frontendUrl
                                        + "/?page=profile&checkout=success"
                        )

                        .setCancelUrl(
                                frontendUrl
                                        + "/?page=profile&checkout=cancelled"
                        )

                        .putMetadata(
                                "userId",
                                user.getId()
                                        .toString()
                        )

                        .putMetadata(
                                "planCode",
                                "PREMIUM"
                        )

                        .setSubscriptionData(
                                subscriptionData
                        )

                        .addLineItem(
                                lineItem
                        )

                        .build();

        try {

            Session session =
                    Session.create(
                            params
                    );

            if (
                    session.getUrl()
                            == null
            ) {

                throw new BadRequestException(
                        "Stripe n'a pas renvoyé d'URL de paiement"
                );
            }

            return session.getUrl();

        } catch (StripeException ex) {

            throw new BadRequestException(
                    "Impossible de créer la session de paiement Stripe : "
                            + ex.getMessage()
            );
        }
    }

    public void scheduleCancellation(
            UserSubscription subscription
    ) {

        ensureConfigured();

        Stripe.apiKey =
                secretKey;

        try {

            com.stripe.model.Subscription
                    stripeSubscription =
                    com.stripe.model.Subscription
                            .retrieve(
                                    subscription
                                            .getStripeSubscriptionId()
                            );

            SubscriptionUpdateParams params =
                    SubscriptionUpdateParams
                            .builder()
                            .setCancelAtPeriodEnd(
                                    true
                            )
                            .build();

            stripeSubscription.update(
                    params
            );

        } catch (StripeException ex) {

            throw new BadRequestException(
                    "Impossible de programmer l'annulation Stripe : "
                            + ex.getMessage()
            );
        }
    }

    private void ensureConfigured() {

        if (
                secretKey == null
                        || secretKey.isBlank()
        ) {

            throw new BadRequestException(
                    "Stripe n'est pas configuré. Définissez STRIPE_SECRET_KEY."
            );
        }
    }
}