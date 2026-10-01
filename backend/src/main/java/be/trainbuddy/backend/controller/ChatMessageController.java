package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.ChatMessageRequest;
import be.trainbuddy.backend.dto.ChatMessageResponse;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.service.ChatMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{sessionId}/messages")
@RequiredArgsConstructor
@Tag(
        name = "Chat Messages",
        description = "Chat anonyme lié aux sessions"
)
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @PostMapping
    @Operation(
            summary = "Envoyer un message anonyme en tant que participant authentifié"
    )
    public ChatMessageResponse sendMessage(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return chatMessageService.sendMessage(
                sessionId,
                request,
                currentUser
        );
    }

    @GetMapping
    @Operation(
            summary = "Lister les messages d'une session si l'utilisateur y participe"
    )
    public List<ChatMessageResponse> getMessages(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User currentUser
    ) {
        return chatMessageService.getMessages(
                sessionId,
                currentUser
        );
    }
}