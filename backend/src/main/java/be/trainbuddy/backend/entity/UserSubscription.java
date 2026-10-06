package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "subscriptions",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = "user_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "plan_id",
            nullable = false
    )
    private SubscriptionPlan plan;

    /*
     * ACTIVE
     * PAST_DUE
     * CANCELLED
     * EXPIRED
     */
    @Column(
            nullable = false,
            length = 30
    )
    private String status;

    @Column(
            nullable = false,
            length = 30
    )
    private String provider;

    @Column(
            name = "stripe_customer_id",
            length = 255
    )
    private String stripeCustomerId;

    @Column(
            name = "stripe_subscription_id",
            unique = true,
            length = 255
    )
    private String stripeSubscriptionId;

    @Column(
            name = "started_at"
    )
    private LocalDateTime startedAt;

    @Column(
            name = "current_period_end"
    )
    private LocalDateTime currentPeriodEnd;

    @Column(
            name = "cancel_at_period_end",
            nullable = false
    )
    private boolean cancelAtPeriodEnd;

    @Column(
            name = "cancelled_at"
    )
    private LocalDateTime cancelledAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;
}