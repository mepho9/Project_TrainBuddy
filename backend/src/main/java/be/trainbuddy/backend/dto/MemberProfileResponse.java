package be.trainbuddy.backend.dto;

import java.util.List;

public record MemberProfileResponse(
        List<String> sportsPreferences,
        String goals,
        String availability,
        String preferredLanguage,
        List<GymResponse> favoriteGyms
) {
}