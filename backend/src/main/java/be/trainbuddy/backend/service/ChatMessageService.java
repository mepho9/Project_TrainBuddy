package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.ChatMessageRequest;
import be.trainbuddy.backend.dto.ChatMessageResponse;
import be.trainbuddy.backend.entity.ChatMessage;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ForbiddenException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.ChatMessageRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final SessionParticipantRepository participantRepository;

    @Transactional
    public ChatMessageResponse sendMessage(
            UUID sessionId,
            ChatMessageRequest request,
            User currentUser
    ) {
        TrainingSession session = getSession(sessionId);

        SessionParticipant participant =
                requireParticipation(
                        sessionId,
                        currentUser
                );

        if (!"UPCOMING".equalsIgnoreCase(
                session.getStatus()
        )) {
            throw new BadRequestException(
                    "Le chat de cette session n'accepte plus de nouveaux messages"
            );
        }

        ChatMessage message =
                ChatMessage.builder()
                        .session(session)
                        .participant(participant)
                        .message(request.message().trim())
                        .sentAt(LocalDateTime.now())
                        .deleted(false)
                        .build();

        return toResponse(
                chatMessageRepository.save(message)
        );
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(
            UUID sessionId,
            User currentUser
    ) {
        TrainingSession session = getSession(sessionId);

        requireParticipation(
                sessionId,
                currentUser
        );

        return chatMessageRepository
                .findBySessionAndDeletedFalseOrderBySentAtAsc(
                        session
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TrainingSession getSession(
            UUID sessionId
    ) {
        return trainingSessionRepository
                .findById(sessionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Session introuvable"
                        )
                );
    }

    private SessionParticipant requireParticipation(
            UUID sessionId,
            User currentUser
    ) {
        return participantRepository
                .findBySessionIdAndUserId(
                        sessionId,
                        currentUser.getId()
                )
                .orElseThrow(() ->
                        new ForbiddenException(
                                "Vous devez participer à cette session pour accéder au chat"
                        )
                );
    }

    private ChatMessageResponse toResponse(
            ChatMessage message
    ) {
        return new ChatMessageResponse(
                message.getId(),
                message.getParticipant()
                        .getRecognitionCode(),
                message.getMessage(),
                message.getSentAt()
        );
    }
}