package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrainingSessionResponse(
        UUID id,
        String title,
        String activityType,
        String description,
        LocalDateTime startAt,
        int durationMin,
        int capacity,
        String status,
        String visibility,
        UUID gymId,
        String gymName
) {
}