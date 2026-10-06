package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.service.StripeWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeWebhookService
            stripeWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<String>
    handleWebhook(

            @RequestBody
            String payload,

            @RequestHeader("Stripe-Signature")
            String stripeSignature

    ) {

        stripeWebhookService
                .handleWebhook(

                        payload,

                        stripeSignature
                );

        return ResponseEntity.ok(
                "received"
        );
    }
}