package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record GymRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        @Size(max = 50)
        String type,

        @NotBlank
        @Size(max = 255)
        String address,

        BigDecimal latitude,
        BigDecimal longitude
) {
}