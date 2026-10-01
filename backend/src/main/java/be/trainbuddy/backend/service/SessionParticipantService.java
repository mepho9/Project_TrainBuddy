package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.ParticipantResponse;
import be.trainbuddy.backend.dto.ParticipationStatusResponse;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class SessionParticipantService {

    private final SessionParticipantRepository participantRepository;
    private final TrainingSessionRepository trainingSessionRepository;

    @Transactional
    public ParticipantResponse joinSession(
            UUID sessionId,
            User currentUser
    ) {
        TrainingSession session =
                trainingSessionRepository.findByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        ensureSessionAcceptsParticipants(session);

        if (participantRepository.existsBySessionIdAndUserId(
                sessionId,
                currentUser.getId()
        )) {
            throw new ConflictException(
                    "Vous participez déjà à cette session"
            );
        }

        long currentParticipants =
                participantRepository.countBySessionId(sessionId);

        if (currentParticipants >= session.getCapacity()) {
            throw new BadRequestException(
                    "La session est complète"
            );
        }

        SessionParticipant participant =
                SessionParticipant.builder()
                        .session(session)
                        .user(currentUser)
                        .joinedAt(LocalDateTime.now())
                        .recognitionCode(
                                generateUniqueRecognitionCode(sessionId)
                        )
                        .creator(false)
                        .build();

        try {
            return toResponse(
                    participantRepository.saveAndFlush(participant)
            );
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException(
                    "Vous participez déjà à cette session"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> getParticipants(
            UUID sessionId
    ) {
        ensureSessionExists(sessionId);

        return participantRepository
                .findBySessionIdOrderByJoinedAtAsc(sessionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParticipationStatusResponse getMyParticipation(
            UUID sessionId,
            User currentUser
    ) {
        ensureSessionExists(sessionId);

        return participantRepository
                .findBySessionIdAndUserId(
                        sessionId,
                        currentUser.getId()
                )
                .map(participant ->
                        new ParticipationStatusResponse(
                                true,
                                toResponse(participant)
                        )
                )
                .orElseGet(() ->
                        new ParticipationStatusResponse(
                                false,
                                null
                        )
                );
    }

    @Transactional
    public SessionParticipant registerCreator(
            TrainingSession session,
            User creator
    ) {
        SessionParticipant participant =
                SessionParticipant.builder()
                        .session(session)
                        .user(creator)
                        .joinedAt(LocalDateTime.now())
                        .recognitionCode(
                                generateUniqueRecognitionCode(
                                        session.getId()
                                )
                        )
                        .creator(true)
                        .build();

        return participantRepository.save(participant);
    }

    private void ensureSessionExists(UUID sessionId) {
        if (!trainingSessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException(
                    "Session introuvable"
            );
        }
    }

    private void ensureSessionAcceptsParticipants(
            TrainingSession session
    ) {
        if (!"UPCOMING".equalsIgnoreCase(
                session.getStatus()
        )) {
            throw new BadRequestException(
                    "Cette session n'accepte plus de nouveaux participants"
            );
        }
    }

    private ParticipantResponse toResponse(
            SessionParticipant participant
    ) {
        return new ParticipantResponse(
                participant.getId(),
                "Participant "
                        + participant.getRecognitionCode(),
                participant.getRecognitionCode(),
                participant.isCreator(),
                participant.getJoinedAt()
        );
    }

    private String generateUniqueRecognitionCode(
            UUID sessionId
    ) {
        for (int attempt = 0; attempt < 20; attempt++) {

            int number = ThreadLocalRandom
                    .current()
                    .nextInt(1000, 10000);

            String code = "TB-" + number;

            if (!participantRepository
                    .existsBySessionIdAndRecognitionCode(
                            sessionId,
                            code
                    )) {
                return code;
            }
        }

        throw new IllegalStateException(
                "Impossible de générer un code de reconnaissance unique"
        );
    }
}