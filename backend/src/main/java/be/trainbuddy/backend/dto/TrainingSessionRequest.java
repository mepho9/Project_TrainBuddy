package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrainingSessionRequest(
        @NotNull
        UUID gymId,

        @NotBlank
        @Size(min = 3, max = 120)
        String title,

        @NotBlank
        @Size(max = 60)
        String activityType,

        String description,

        @NotNull
        LocalDateTime startAt,

        @Min(15)
        @Max(300)
        int durationMin,

        @Min(2)
        int capacity,

        @NotBlank
        String visibility
) {
}