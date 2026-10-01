package be.trainbuddy.backend.dto;

import java.util.List;

public record MySessionsResponse(
        List<TrainingSessionResponse> created,
        List<TrainingSessionResponse> joined
) {
}