package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.JoinSessionRequest;
import be.trainbuddy.backend.dto.ParticipantResponse;
import be.trainbuddy.backend.service.SessionParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{sessionId}")
@RequiredArgsConstructor
@Tag(name = "Session Participants", description = "Participation anonyme aux sessions")
public class SessionParticipantController {

    private final SessionParticipantService participantService;

    @PostMapping("/join")
    @Operation(summary = "Rejoindre une session")
    public ParticipantResponse joinSession(
            @PathVariable UUID sessionId,
            @Valid @RequestBody JoinSessionRequest request
    ) {
        return participantService.joinSession(sessionId, request);
    }

    @GetMapping("/participants")
    @Operation(summary = "Lister les participants anonymes d'une session")
    public List<ParticipantResponse> getParticipants(@PathVariable UUID sessionId) {
        return participantService.getParticipants(sessionId);
    }
}