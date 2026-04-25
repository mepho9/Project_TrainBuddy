package be.trainbuddy.backend.controller;

import be.trainbuddy.backend.dto.ChatMessageRequest;
import be.trainbuddy.backend.dto.ChatMessageResponse;
import be.trainbuddy.backend.service.ChatMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{sessionId}/messages")
@RequiredArgsConstructor
@Tag(name = "Chat Messages", description = "Chat anonyme lié aux sessions")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @PostMapping
    @Operation(summary = "Envoyer un message anonyme")
    public ChatMessageResponse sendMessage(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        return chatMessageService.sendMessage(sessionId, request);
    }

    @GetMapping
    @Operation(summary = "Lister les messages anonymes d'une session")
    public List<ChatMessageResponse> getMessages(@PathVariable UUID sessionId) {
        return chatMessageService.getMessages(sessionId);
    }
}