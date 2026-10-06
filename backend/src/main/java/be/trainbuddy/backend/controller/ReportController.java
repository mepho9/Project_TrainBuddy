package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.ReportRequest;
import be.trainbuddy.backend.dto.ReportResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(
        name = "Reports",
        description = "Création de signalements par les membres"
)
public class ReportController {

    private final ReportService
            reportService;

    @PostMapping(
            "/sessions/{sessionId}"
    )
    @ResponseStatus(
            HttpStatus.CREATED
    )
    @Operation(
            summary = "Signaler une session"
    )
    public ReportResponse reportSession(

            @PathVariable
            UUID sessionId,

            @Valid
            @RequestBody
            ReportRequest request,

            @AuthenticationPrincipal
            User currentUser

    ) {

        return reportService.reportSession(

                sessionId,

                request,

                currentUser
        );
    }

    @PostMapping(
            "/participants/{participantId}"
    )
    @ResponseStatus(
            HttpStatus.CREATED
    )
    @Operation(
            summary = "Signaler anonymement un participant"
    )
    public ReportResponse reportParticipant(

            @PathVariable
            UUID participantId,

            @Valid
            @RequestBody
            ReportRequest request,

            @AuthenticationPrincipal
            User currentUser

    ) {

        return reportService.reportParticipant(

                participantId,

                request,

                currentUser
        );
    }
}