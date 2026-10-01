package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.TrainingSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(
        name = "Training Sessions",
        description = "Gestion des sessions d'entraînement"
)
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    @GetMapping
    @Operation(
            summary = "Rechercher et lister les sessions d'entraînement"
    )
    public List<TrainingSessionResponse> getAllSessions(

            @RequestParam(required = false)
            String q,

            @RequestParam(required = false)
            UUID gymId,

            @RequestParam(required = false)
            String activityType,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date,

            @RequestParam(defaultValue = "false")
            boolean availableOnly,

            @RequestParam(required = false)
            Double latitude,

            @RequestParam(required = false)
            Double longitude,

            @RequestParam(required = false)
            Double radiusKm,

            @RequestParam(defaultValue = "false")
            boolean sortByDistance

    ) {

        return trainingSessionService.search(
                q,
                gymId,
                activityType,
                date,
                availableOnly,
                latitude,
                longitude,
                radiusKm,
                sortByDistance
        );
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Consulter une session d'entraînement"
    )
    public TrainingSessionResponse getSessionById(
            @PathVariable UUID id
    ) {
        return trainingSessionService.findById(id);
    }

    @PostMapping
    @Operation(
            summary = "Créer une session d'entraînement"
    )
    public TrainingSessionResponse createSession(

            @Valid
            @RequestBody
            TrainingSessionRequest request,

            @AuthenticationPrincipal
            User currentUser

    ) {

        return trainingSessionService.create(
                request,
                currentUser
        );
    }
}