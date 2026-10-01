package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminSessionResponse(

        UUID id,

        String title,

        String activityType,

        String status,

        LocalDateTime startAt,

        int durationMin,

        int capacity,

        int participantCount,

        String gymName,

        String creatorEmail

) {
}