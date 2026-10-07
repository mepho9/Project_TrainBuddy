package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.ChangePasswordRequest;
import be.trainbuddy.backend.dto.DeleteAccountRequest;
import be.trainbuddy.backend.dto.MemberProfileResponse;
import be.trainbuddy.backend.dto.MemberProfileUpdateRequest;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(
        name = "Member profile",
        description = "Préférences, favoris et gestion du compte membre"
)
public class ProfileController {

    private final ProfileService
            profileService;

    @GetMapping("/me")
    @Operation(
            summary = "Consulter mon profil membre"
    )
    public MemberProfileResponse getMyProfile(
            @AuthenticationPrincipal
            User currentUser
    ) {
        return profileService
                .getProfile(
                        currentUser
                );
    }

    @PutMapping("/me")
    @Operation(
            summary = "Modifier mon profil membre"
    )
    public MemberProfileResponse updateMyProfile(
            @AuthenticationPrincipal
            User currentUser,

            @Valid
            @RequestBody
            MemberProfileUpdateRequest request
    ) {
        return profileService
                .updateProfile(
                        currentUser,
                        request
                );
    }

    @PostMapping(
            "/favorites/{gymId}"
    )
    @Operation(
            summary = "Ajouter une salle à mes favoris"
    )
    public MemberProfileResponse addFavoriteGym(
            @AuthenticationPrincipal
            User currentUser,

            @PathVariable
            UUID gymId
    ) {
        return profileService
                .addFavoriteGym(
                        currentUser,
                        gymId
                );
    }

    @DeleteMapping(
            "/favorites/{gymId}"
    )
    @Operation(
            summary = "Retirer une salle de mes favoris"
    )
    public MemberProfileResponse removeFavoriteGym(
            @AuthenticationPrincipal
            User currentUser,

            @PathVariable
            UUID gymId
    ) {
        return profileService
                .removeFavoriteGym(
                        currentUser,
                        gymId
                );
    }

    @PatchMapping("/password")
    @ResponseStatus(
            HttpStatus.NO_CONTENT
    )
    @Operation(
            summary = "Changer mon mot de passe"
    )
    public void changePassword(
            @AuthenticationPrincipal
            User currentUser,

            @Valid
            @RequestBody
            ChangePasswordRequest request
    ) {
        profileService
                .changePassword(
                        currentUser,
                        request.currentPassword(),
                        request.newPassword()
                );
    }

    @DeleteMapping("/me")
    @ResponseStatus(
            HttpStatus.NO_CONTENT
    )
    @Operation(
            summary = "Supprimer et anonymiser mon compte"
    )
    public void deleteMyAccount(
            @AuthenticationPrincipal
            User currentUser,

            @Valid
            @RequestBody
            DeleteAccountRequest request
    ) {
        profileService
                .deleteAccount(
                        currentUser,
                        request.currentPassword()
                );
    }
}