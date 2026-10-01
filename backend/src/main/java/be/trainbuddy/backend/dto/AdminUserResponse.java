package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(

        UUID id,

        String email,

        String role,

        boolean banned,

        LocalDateTime createdAt,

        LocalDateTime lastLoginAt

) {
}