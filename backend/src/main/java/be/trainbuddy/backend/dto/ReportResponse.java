package be.trainbuddy.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportResponse(

        UUID id,

        String targetType,

        String reason,

        String details,

        String status,

        LocalDateTime createdAt

) {
}