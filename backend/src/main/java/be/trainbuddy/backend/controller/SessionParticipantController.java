package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.ParticipantResponse;
import be.trainbuddy.backend.dto.ParticipationStatusResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.SessionParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{sessionId}")
@RequiredArgsConstructor
@Tag(
        name = "Session Participants",
        description = "Participation anonyme aux sessions"
)
public class SessionParticipantController {

    private final SessionParticipantService participantService;

    @PostMapping("/join")
    @Operation(
            summary = "Rejoindre une session avec l'utilisateur authentifié"
    )
    public ParticipantResponse joinSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User currentUser
    ) {
        return participantService.joinSession(
                sessionId,
                currentUser
        );
    }

    @DeleteMapping("/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Quitter une session"
    )
    public void leaveSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User currentUser
    ) {
        participantService.leaveSession(
                sessionId,
                currentUser
        );
    }

    @GetMapping("/participants")
    @Operation(
            summary = "Lister les participants anonymes d'une session"
    )
    public List<ParticipantResponse> getParticipants(
            @PathVariable UUID sessionId
    ) {
        return participantService.getParticipants(
                sessionId
        );
    }

    @GetMapping("/membership")
    @Operation(
            summary = "Vérifier si l'utilisateur authentifié participe à la session"
    )
    public ParticipationStatusResponse getMyParticipation(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User currentUser
    ) {
        return participantService.getMyParticipation(
                sessionId,
                currentUser
        );
    }
}