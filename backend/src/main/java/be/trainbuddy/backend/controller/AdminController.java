package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.AdminSessionResponse;
import be.trainbuddy.backend.dto.AdminUserResponse;
import be.trainbuddy.backend.dto.GymRequest;
import be.trainbuddy.backend.dto.GymResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.AdminService;
import be.trainbuddy.backend.service.GymService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(
        name = "Administration",
        description = "Back-office TrainBuddy réservé aux administrateurs"
)
public class AdminController {

    private final AdminService adminService;
    private final GymService gymService;

    /*
     * =========================
     * UTILISATEURS
     * =========================
     */

    @GetMapping("/users")
    @Operation(
            summary = "Lister les utilisateurs"
    )
    public List<AdminUserResponse> getUsers() {

        return adminService.getUsers();
    }

    @PatchMapping("/users/{id}/ban")
    @Operation(
            summary = "Bannir un utilisateur"
    )
    public AdminUserResponse banUser(

            @PathVariable UUID id,

            @AuthenticationPrincipal
            User currentAdmin

    ) {

        return adminService.banUser(
                id,
                currentAdmin
        );
    }

    @PatchMapping("/users/{id}/unban")
    @Operation(
            summary = "Débannir un utilisateur"
    )
    public AdminUserResponse unbanUser(
            @PathVariable UUID id
    ) {

        return adminService.unbanUser(
                id
        );
    }

    /*
     * =========================
     * SALLES
     * =========================
     */

    @GetMapping("/gyms")
    @Operation(
            summary = "Lister toutes les salles"
    )
    public List<GymResponse> getGyms() {

        return gymService
                .findAllForAdmin();
    }

    @PostMapping("/gyms")
    @Operation(
            summary = "Créer une salle"
    )
    public GymResponse createGym(

            @Valid
            @RequestBody
            GymRequest request

    ) {

        return gymService.create(
                request
        );
    }

    @PutMapping("/gyms/{id}")
    @Operation(
            summary = "Modifier une salle"
    )
    public GymResponse updateGym(

            @PathVariable UUID id,

            @Valid
            @RequestBody
            GymRequest request

    ) {

        return gymService.update(
                id,
                request
        );
    }

    @PatchMapping("/gyms/{id}/active")
    @Operation(
            summary = "Activer ou désactiver une salle"
    )
    public GymResponse setGymActive(

            @PathVariable UUID id,

            @RequestParam
            boolean active

    ) {

        return gymService.setActive(
                id,
                active
        );
    }

    /*
     * =========================
     * SESSIONS
     * =========================
     */

    @GetMapping("/sessions")
    @Operation(
            summary = "Lister toutes les sessions"
    )
    public List<AdminSessionResponse>
    getSessions() {

        return adminService.getSessions();
    }

    @PatchMapping(
            "/sessions/{id}/cancel"
    )
    @Operation(
            summary = "Retirer une session de la plateforme"
    )
    public AdminSessionResponse
    cancelSession(
            @PathVariable UUID id
    ) {

        return adminService
                .cancelSession(id);
    }
}