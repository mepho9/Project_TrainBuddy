package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.service.TrainingSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Training Sessions", description = "Gestion des sessions d'entraînement")
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    @GetMapping
    @Operation(summary = "Lister les sessions d'entraînement")
    public List<TrainingSessionResponse> getAllSessions() {
        return trainingSessionService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter une session d'entraînement")
    public TrainingSessionResponse getSessionById(@PathVariable UUID id) {
        return trainingSessionService.findById(id);
    }

    @PostMapping
    @Operation(summary = "Créer une session d'entraînement")
    public TrainingSessionResponse createSession(@Valid @RequestBody TrainingSessionRequest request) {
        return trainingSessionService.create(request);
    }
}