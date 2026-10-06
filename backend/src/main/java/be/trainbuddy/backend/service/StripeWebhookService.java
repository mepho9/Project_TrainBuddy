package be.trainbuddy.backend.service;

import be.trainbuddy.backend.exception.BadRequestException;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookService {

    private final SubscriptionService subscriptionService;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    public void handleWebhook(
            String payload,
            String signatureHeader
    ) {

        if (
                webhookSecret == null
                        || webhookSecret.isBlank()
        ) {
            throw new BadRequestException(
                    "STRIPE_WEBHOOK_SECRET n'est pas configuré"
            );
        }

        Event event;

        try {

            event = Webhook.constructEvent(
                    payload,
                    signatureHeader,
                    webhookSecret
            );

        } catch (SignatureVerificationException ex) {

            log.error(
                    "Signature Stripe invalide"
            );

            throw new BadRequestException(
                    "Signature Stripe invalide"
            );
        }

        log.info(
                "Webhook Stripe reçu : type={}, id={}, apiVersion={}",
                event.getType(),
                event.getId(),
                event.getApiVersion()
        );

        /*
         * Important :
         *
         * On ne désérialise que les événements
         * réellement utiles à TrainBuddy.
         *
         * Les autres événements Stripe sont
         * volontairement ignorés avec HTTP 200.
         */
        switch (event.getType()) {

            case "checkout.session.completed" -> {

                StripeObject object =
                        deserializeEventObject(
                                event
                        );

                if (
                        !(object instanceof Session session)
                ) {
                    throw new BadRequestException(
                            "Le webhook checkout.session.completed ne contient pas une Checkout Session valide"
                    );
                }

                handleCheckoutCompleted(
                        session
                );
            }

            case "customer.subscription.created",
                 "customer.subscription.updated",
                 "customer.subscription.deleted" -> {

                StripeObject object =
                        deserializeEventObject(
                                event
                        );

                if (
                        !(object instanceof
                                com.stripe.model.Subscription stripeSubscription)
                ) {
                    throw new BadRequestException(
                            "Le webhook d'abonnement Stripe ne contient pas un abonnement valide"
                    );
                }

                /*
                 * Si checkout.session.completed
                 * a déjà créé l'abonnement local,
                 * ceci synchronise son état.
                 *
                 * Si l'événement arrive avant
                 * Checkout, SubscriptionService
                 * l'ignore temporairement.
                 */
                subscriptionService
                        .syncStripeSubscription(
                                stripeSubscription
                        );
            }

            default -> {

                log.debug(
                        "Événement Stripe ignoré : {}",
                        event.getType()
                );
            }
        }
    }

    /*
     * Stripe recommande getObject() lorsque
     * l'événement peut être désérialisé de
     * manière sûre.
     *
     * Si Stripe considère la désérialisation
     * sûre impossible, on tente explicitement
     * deserializeUnsafe() au lieu d'ignorer
     * silencieusement le webhook.
     */
    private StripeObject deserializeEventObject(
            Event event
    ) {

        EventDataObjectDeserializer deserializer =
                event.getDataObjectDeserializer();

        StripeObject safeObject =
                deserializer
                        .getObject()
                        .orElse(null);

        if (safeObject != null) {

            log.info(
                    "Désérialisation Stripe sûre réussie pour {}",
                    event.getType()
            );

            return safeObject;
        }

        log.warn(
                "Désérialisation Stripe sûre impossible pour {}. Tentative deserializeUnsafe().",
                event.getType()
        );

        try {

            StripeObject unsafeObject =
                    deserializer
                            .deserializeUnsafe();

            log.info(
                    "Désérialisation Stripe fallback réussie pour {}",
                    event.getType()
            );

            return unsafeObject;

        } catch (
                EventDataObjectDeserializationException ex
        ) {

            log.error(
                    "Impossible de désérialiser le webhook Stripe {} : {}",
                    event.getType(),
                    ex.getMessage()
            );

            throw new BadRequestException(
                    "Impossible de lire les données du webhook Stripe"
            );
        }
    }

    private void handleCheckoutCompleted(
            Session session
    ) {

        log.info(
                "Traitement checkout.session.completed : sessionId={}, customer={}, subscription={}",
                session.getId(),
                session.getCustomer(),
                session.getSubscription()
        );

        if (
                !"subscription"
                        .equalsIgnoreCase(
                                session.getMode()
                        )
        ) {

            log.info(
                    "Checkout {} ignoré : mode={}",
                    session.getId(),
                    session.getMode()
            );

            return;
        }

        String userIdValue =
                session
                        .getMetadata()
                        .get(
                                "userId"
                        );

        if (
                userIdValue == null
                        || userIdValue.isBlank()
        ) {

            throw new BadRequestException(
                    "Le webhook Stripe ne contient pas l'utilisateur TrainBuddy"
            );
        }

        String stripeSubscriptionId =
                session.getSubscription();

        if (
                stripeSubscriptionId == null
                        || stripeSubscriptionId.isBlank()
        ) {

            throw new BadRequestException(
                    "Stripe n'a pas fourni l'identifiant de l'abonnement"
            );
        }

        UUID userId;

        try {

            userId =
                    UUID.fromString(
                            userIdValue
                    );

        } catch (
                IllegalArgumentException ex
        ) {

            throw new BadRequestException(
                    "L'identifiant utilisateur Stripe est invalide"
            );
        }

        log.info(
                "Activation Premium TrainBuddy : userId={}, stripeSubscriptionId={}",
                userId,
                stripeSubscriptionId
        );

        subscriptionService
                .activatePremiumFromCheckout(

                        userId,

                        session.getCustomer(),

                        stripeSubscriptionId,

                        session.getAmountTotal(),

                        session.getCurrency(),

                        session.getId()
                );

        log.info(
                "Premium activé avec succès : userId={}",
                userId
        );
    }
}