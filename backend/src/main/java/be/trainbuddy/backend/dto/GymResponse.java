package be.trainbuddy.backend.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record GymResponse(
        UUID id,
        String name,
        String type,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        boolean active
) {
}