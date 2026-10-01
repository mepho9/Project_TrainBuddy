package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(

        @NotBlank
        @Size(min = 1, max = 1000)
        String message

) {
}