package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminReportResponse(

        UUID id,

        String status,

        String reason,

        String details,

        LocalDateTime createdAt,

        LocalDateTime reviewedAt,

        String reporterEmail,

        String targetType,

        UUID targetUserId,

        String targetUserEmail,

        Boolean targetUserBanned,

        UUID targetSessionId,

        String targetSessionTitle,

        String targetSessionStatus,

        String reviewedByEmail,

        List<ModerationActionResponse> actions

) {
}