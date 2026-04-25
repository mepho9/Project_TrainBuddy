package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.ChatMessageRequest;
import be.trainbuddy.backend.dto.ChatMessageResponse;
import be.trainbuddy.backend.entity.ChatMessage;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.ChatMessageRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final SessionParticipantRepository participantRepository;

    public ChatMessageResponse sendMessage(UUID sessionId, ChatMessageRequest request) {
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable"));

        SessionParticipant participant = participantRepository.findById(request.participantId())
                .orElseThrow(() -> new ResourceNotFoundException("Participant introuvable"));

        if (!participant.getSession().getId().equals(session.getId())) {
            throw new BadRequestException("Ce participant n'appartient pas à cette session");
        }

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .participant(participant)
                .message(request.message())
                .sentAt(LocalDateTime.now())
                .deleted(false)
                .build();

        return toResponse(chatMessageRepository.save(message), "Participant");
    }

    public List<ChatMessageResponse> getMessages(UUID sessionId) {
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable"));

        AtomicInteger counter = new AtomicInteger(1);

        return chatMessageRepository.findBySessionAndDeletedFalseOrderBySentAtAsc(session)
                .stream()
                .map(message -> toResponse(message, "Participant " + counter.getAndIncrement()))
                .toList();
    }

    private ChatMessageResponse toResponse(ChatMessage message, String anonymousAuthor) {
        return new ChatMessageResponse(
                message.getId(),
                anonymousAuthor,
                message.getMessage(),
                message.getSentAt()
        );
    }
}