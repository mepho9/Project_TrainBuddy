package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;

public record SubscriptionStatusResponse(

        String planCode,

        String planName,

        boolean premium,

        String status,

        int priceCents,

        String currency,

        int maxActiveSessions,

        int activeCreatedSessions,

        int maxCapacity,

        boolean advancedFilters,

        boolean highlightedSessions,

        LocalDateTime currentPeriodEnd,

        boolean cancelAtPeriodEnd

) {
}