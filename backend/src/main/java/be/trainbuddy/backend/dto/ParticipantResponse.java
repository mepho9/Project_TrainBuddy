package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ParticipantResponse(
        UUID id,
        String anonymousName,
        String recognitionCode,
        boolean creator,
        LocalDateTime joinedAt
) {
}