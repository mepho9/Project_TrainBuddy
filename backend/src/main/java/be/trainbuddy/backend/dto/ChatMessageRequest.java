package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ChatMessageRequest(
        UUID participantId,

        @NotBlank
        @Size(min = 1, max = 1000)
        String message
) {
}