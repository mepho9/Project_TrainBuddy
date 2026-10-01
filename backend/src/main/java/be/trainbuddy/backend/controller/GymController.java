package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.GymResponse;
import be.trainbuddy.backend.service.GymService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gyms")
@RequiredArgsConstructor
@Tag(
        name = "Gyms",
        description = "Consultation publique des salles de sport"
)
public class GymController {

    private final GymService gymService;

    @GetMapping
    @Operation(
            summary = "Lister les salles actives"
    )
    public List<GymResponse> getAllGyms() {
        return gymService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Consulter une salle de sport"
    )
    public GymResponse getGymById(
            @PathVariable UUID id
    ) {
        return gymService.findById(id);
    }
}