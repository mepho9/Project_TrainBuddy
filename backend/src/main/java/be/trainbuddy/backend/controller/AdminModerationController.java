package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.AdminReportResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.ModerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/v1/admin/reports"
)
@RequiredArgsConstructor
@Tag(
        name = "Administration - Reports",
        description = "Traitement administratif des signalements"
)
public class AdminModerationController {

    private final ModerationService
            moderationService;

    @GetMapping
    @Operation(
            summary = "Lister tous les signalements"
    )
    public List<AdminReportResponse>
    getReports() {

        return moderationService
                .getReports();
    }

    @PatchMapping(
            "/{id}/review"
    )
    @Operation(
            summary = "Prendre un signalement en charge"
    )
    public AdminReportResponse
    reviewReport(

            @PathVariable
            UUID id,

            @AuthenticationPrincipal
            User currentAdmin

    ) {

        return moderationService
                .reviewReport(
                        id,
                        currentAdmin
                );
    }

    @PatchMapping(
            "/{id}/ignore"
    )
    @Operation(
            summary = "Ignorer et fermer un signalement"
    )
    public AdminReportResponse
    ignoreReport(

            @PathVariable
            UUID id,

            @AuthenticationPrincipal
            User currentAdmin

    ) {

        return moderationService
                .ignoreReport(
                        id,
                        currentAdmin
                );
    }

    @PatchMapping(
            "/{id}/cancel-session"
    )
    @Operation(
            summary = "Retirer la session signalée"
    )
    public AdminReportResponse
    cancelSession(

            @PathVariable
            UUID id,

            @AuthenticationPrincipal
            User currentAdmin

    ) {

        return moderationService
                .cancelReportedSession(
                        id,
                        currentAdmin
                );
    }

    @PatchMapping(
            "/{id}/ban-user"
    )
    @Operation(
            summary = "Bannir l'utilisateur signalé"
    )
    public AdminReportResponse
    banUser(

            @PathVariable
            UUID id,

            @AuthenticationPrincipal
            User currentAdmin

    ) {

        return moderationService
                .banReportedUser(
                        id,
                        currentAdmin
                );
    }
}