package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank
        String currentPassword
) {
}