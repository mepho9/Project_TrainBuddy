package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(
            nullable = false,
            unique = true,
            length = 30
    )
    private String code;

    @Column(
            nullable = false,
            length = 80
    )
    private String name;

    @Column(
            name = "price_cents",
            nullable = false
    )
    private int priceCents;

    @Column(
            nullable = false,
            length = 3
    )
    private String currency;

    @Column(
            name = "billing_interval",
            nullable = false,
            length = 20
    )
    private String billingInterval;

    @Column(
            name = "max_active_sessions",
            nullable = false
    )
    private int maxActiveSessions;

    @Column(
            name = "max_capacity",
            nullable = false
    )
    private int maxCapacity;

    @Column(
            name = "advanced_filters",
            nullable = false
    )
    private boolean advancedFilters;

    @Column(
            name = "highlighted_sessions",
            nullable = false
    )
    private boolean highlightedSessions;

    @Column(nullable = false)
    private boolean active;
}