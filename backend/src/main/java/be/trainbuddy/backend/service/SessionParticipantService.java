package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.JoinSessionRequest;
import be.trainbuddy.backend.dto.ParticipantResponse;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import be.trainbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class SessionParticipantService {

    private final SessionParticipantRepository participantRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final UserRepository userRepository;

    public ParticipantResponse joinSession(UUID sessionId, JoinSessionRequest request) {
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable"));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        if (participantRepository.existsBySessionAndUser(session, user)) {
            throw new ConflictException("L'utilisateur participe déjà à cette session");
        }

        long currentParticipants = participantRepository.countBySession(session);

        if (currentParticipants >= session.getCapacity()) {
            throw new BadRequestException("La session est complète");
        }

        SessionParticipant participant = SessionParticipant.builder()
                .session(session)
                .user(user)
                .joinedAt(LocalDateTime.now())
                .recognitionCode(generateRecognitionCode())
                .creator(false)
                .build();

        return toResponse(participantRepository.save(participant), 1);
    }

    public List<ParticipantResponse> getParticipants(UUID sessionId) {
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable"));

        AtomicInteger counter = new AtomicInteger(1);

        return participantRepository.findBySession(session)
                .stream()
                .map(participant -> toResponse(participant, counter.getAndIncrement()))
                .toList();
    }

    private ParticipantResponse toResponse(SessionParticipant participant, int index) {
        return new ParticipantResponse(
                participant.getId(),
                "Participant " + index,
                participant.getRecognitionCode(),
                participant.isCreator(),
                participant.getJoinedAt()
        );
    }

    private String generateRecognitionCode() {
        int number = new Random().nextInt(9000) + 1000;
        return "TB-" + number;
    }
}