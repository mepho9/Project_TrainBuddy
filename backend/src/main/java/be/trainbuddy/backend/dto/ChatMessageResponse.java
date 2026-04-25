package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        String anonymousAuthor,
        String message,
        LocalDateTime sentAt
) {
}