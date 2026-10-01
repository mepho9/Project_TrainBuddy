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
                trainingSessionRepository
                        .findByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        ensureSessionAcceptsParticipants(session);

        /*
         * On recherche aussi une éventuelle
         * ancienne participation quittée.
         */
        SessionParticipant existingParticipant =
                participantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                currentUser.getId()
                        )
                        .orElse(null);

        if (
                existingParticipant != null
                        && existingParticipant.getLeftAt() == null
        ) {
            throw new ConflictException(
                    "Vous participez déjà à cette session"
            );
        }

        long currentParticipants =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                sessionId
                        );

        if (
                currentParticipants
                        >= session.getCapacity()
        ) {
            throw new BadRequestException(
                    "La session est complète"
            );
        }

        /*
         * Le membre avait déjà participé puis
         * quitté : on réactive sa participation.
         */
        if (existingParticipant != null) {

            if (existingParticipant.isCreator()) {
                throw new BadRequestException(
                        "Le créateur de la session ne peut pas la rejoindre à nouveau"
                );
            }

            existingParticipant.setLeftAt(null);

            existingParticipant.setJoinedAt(
                    LocalDateTime.now()
            );

            try {
                return toResponse(
                        participantRepository.saveAndFlush(
                                existingParticipant
                        )
                );
            } catch (DataIntegrityViolationException ex) {
                throw new ConflictException(
                        "Vous participez déjà à cette session"
                );
            }
        }

        SessionParticipant participant =
                SessionParticipant.builder()
                        .session(session)
                        .user(currentUser)
                        .joinedAt(LocalDateTime.now())
                        .recognitionCode(
                                generateUniqueRecognitionCode(
                                        sessionId
                                )
                        )
                        .creator(false)
                        .leftAt(null)
                        .build();

        try {
            return toResponse(
                    participantRepository
                            .saveAndFlush(participant)
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
                .findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(
                        sessionId
                )
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
                .findBySessionIdAndUserIdAndLeftAtIsNull(
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
    public void leaveSession(
            UUID sessionId,
            User currentUser
    ) {
        TrainingSession session =
                trainingSessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        refreshCompletedStatus(session);

        if (
                !"UPCOMING".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {
            throw new BadRequestException(
                    "Seule une session à venir peut être quittée"
            );
        }

        SessionParticipant participant =
                participantRepository
                        .findBySessionIdAndUserIdAndLeftAtIsNull(
                                sessionId,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Vous ne participez pas à cette session"
                                )
                        );

        /*
         * Le créateur doit annuler sa session,
         * pas la quitter.
         */
        if (participant.isCreator()) {
            throw new BadRequestException(
                    "Le créateur ne peut pas quitter sa propre session. Il doit l'annuler."
            );
        }

        participant.setLeftAt(
                LocalDateTime.now()
        );

        participantRepository.save(participant);
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
                        .leftAt(null)
                        .build();

        return participantRepository.save(participant);
    }

    private void ensureSessionExists(
            UUID sessionId
    ) {
        if (
                !trainingSessionRepository.existsById(
                        sessionId
                )
        ) {
            throw new ResourceNotFoundException(
                    "Session introuvable"
            );
        }
    }

    private void ensureSessionAcceptsParticipants(
            TrainingSession session
    ) {
        refreshCompletedStatus(session);

        if (
                !"UPCOMING".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {
            throw new BadRequestException(
                    "Cette session n'accepte plus de nouveaux participants"
            );
        }
    }

    private void refreshCompletedStatus(
            TrainingSession session
    ) {
        if (
                !"UPCOMING".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {
            return;
        }

        LocalDateTime endAt =
                session.getStartAt()
                        .plusMinutes(
                                session.getDurationMin()
                        );

        if (
                !endAt.isAfter(
                        LocalDateTime.now()
                )
        ) {
            session.setStatus(
                    "COMPLETED"
            );

            trainingSessionRepository.save(session);
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
        for (
                int attempt = 0;
                attempt < 20;
                attempt++
        ) {
            int number =
                    ThreadLocalRandom
                            .current()
                            .nextInt(
                                    1000,
                                    10000
                            );

            String code =
                    "TB-" + number;

            if (
                    !participantRepository
                            .existsBySessionIdAndRecognitionCode(
                                    sessionId,
                                    code
                            )
            ) {
                return code;
            }
        }

        throw new IllegalStateException(
                "Impossible de générer un code de reconnaissance unique"
        );
    }
}