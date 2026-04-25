package be.trainbuddy.backend.dto;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String email,
        String role,
        String token
) {
}