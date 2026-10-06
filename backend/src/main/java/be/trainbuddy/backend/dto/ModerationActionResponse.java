package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ModerationActionResponse(

        UUID id,

        String actionType,

        String adminEmail,

        String notes,

        LocalDateTime createdAt

) {
}