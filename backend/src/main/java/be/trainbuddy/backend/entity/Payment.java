package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "subscription_id",
            nullable = false
    )
    private UserSubscription subscription;

    @Column(
            name = "amount_cents",
            nullable = false
    )
    private long amountCents;

    @Column(
            nullable = false,
            length = 3
    )
    private String currency;

    @Column(
            nullable = false,
            length = 30
    )
    private String provider;

    @Column(
            nullable = false,
            length = 30
    )
    private String status;

    /*
     * Pour le paiement initial,
     * on conserve l'identifiant
     * Checkout Session Stripe.
     *
     * La contrainte unique rend le
     * traitement du webhook idempotent.
     */
    @Column(
            name = "external_payment_id",
            nullable = false,
            unique = true,
            length = 255
    )
    private String externalPaymentId;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;
}