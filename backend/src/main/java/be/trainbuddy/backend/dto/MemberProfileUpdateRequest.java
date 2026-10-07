package be.trainbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MemberProfileUpdateRequest(
        @NotNull
        @Size(max = 6)
        List<@NotBlank @Size(max = 60) String> sportsPreferences,

        @Size(max = 255)
        String goals,

        @Size(max = 255)
        String availability,

        @NotBlank
        @Size(max = 10)
        String preferredLanguage
) {
}