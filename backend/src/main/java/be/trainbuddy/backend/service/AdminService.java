package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.AdminSessionResponse;
import be.trainbuddy.backend.dto.AdminUserResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository
            userRepository;

    private final SessionParticipantRepository
            participantRepository;

    private final TrainingSessionRepository
            trainingSessionRepository;

    /*
     * =========================
     * UTILISATEURS
     * =========================
     */

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {

        return userRepository
                .findAll()
                .stream()
                .sorted(
                        Comparator.comparing(
                                User::getCreatedAt
                        ).reversed()
                )
                .map(this::toUserResponse)
                .toList();
    }

    /*
     * Bannir un utilisateur implique davantage
     * que modifier users.banned.
     *
     * - son compte devient banni
     * - ses participations actives sont terminées
     * - ses futures sessions créées sont annulées
     * - son JWT existant ne fonctionnera plus
     *   car JwtAuthenticationFilter vérifie banned
     *   à chaque requête.
     */
    @Transactional
    public AdminUserResponse banUser(
            UUID userId,
            User currentAdmin
    ) {

        User user =
                findUser(userId);

        if (
                user.getId().equals(
                        currentAdmin.getId()
                )
        ) {
            throw new BadRequestException(
                    "Vous ne pouvez pas bannir votre propre compte administrateur"
            );
        }

        if (
                "ADMIN".equalsIgnoreCase(
                        user.getRole().getName()
                )
        ) {
            throw new BadRequestException(
                    "Un compte administrateur ne peut pas être banni depuis cette interface"
            );
        }

        if (user.isBanned()) {
            throw new ConflictException(
                    "Cet utilisateur est déjà banni"
            );
        }

        List<SessionParticipant>
                activeParticipations =
                participantRepository
                        .findActiveByUserIdWithSession(
                                userId
                        );

        LocalDateTime now =
                LocalDateTime.now();

        for (
                SessionParticipant participation :
                activeParticipations
        ) {

            TrainingSession session =
                    participation.getSession();

            /*
             * Si le membre est créateur d'une
             * future session, celle-ci est annulée.
             */
            if (
                    participation.isCreator()
                            && "UPCOMING"
                            .equalsIgnoreCase(
                                    session.getStatus()
                            )
            ) {
                session.setStatus(
                        "CANCELLED"
                );
            }

            /*
             * Le membre est retiré de toutes ses
             * participations actives.
             */
            participation.setLeftAt(
                    now
            );
        }

        participantRepository.saveAll(
                activeParticipations
        );

        /*
         * Les TrainingSession sont des entités
         * managées, mais saveAll rend ici le
         * comportement explicite.
         */
        List<TrainingSession>
                affectedSessions =
                activeParticipations.stream()
                        .map(
                                SessionParticipant::getSession
                        )
                        .distinct()
                        .toList();

        trainingSessionRepository.saveAll(
                affectedSessions
        );

        user.setBanned(true);

        userRepository.save(user);

        return toUserResponse(user);
    }

    @Transactional
    public AdminUserResponse unbanUser(
            UUID userId
    ) {

        User user =
                findUser(userId);

        if (!user.isBanned()) {
            throw new ConflictException(
                    "Cet utilisateur n'est pas banni"
            );
        }

        user.setBanned(false);

        /*
         * Les anciennes participations ne sont
         * volontairement pas restaurées.
         *
         * L'utilisateur pourra rejoindre de
         * nouvelles sessions normalement.
         */
        return toUserResponse(
                userRepository.save(user)
        );
    }

    /*
     * =========================
     * SESSIONS
     * =========================
     */

    @Transactional
    public List<AdminSessionResponse>
    getSessions() {

        List<TrainingSession> sessions =
                trainingSessionRepository.findAll();

        /*
         * Même logique que dans le reste
         * de l'application :
         * les anciennes UPCOMING deviennent
         * COMPLETED automatiquement.
         */
        sessions.forEach(
                this::refreshStatus
        );

        if (sessions.isEmpty()) {
            return List.of();
        }

        List<UUID> sessionIds =
                sessions.stream()
                        .map(
                                TrainingSession::getId
                        )
                        .toList();

        Map<UUID, Long>
                participantCounts =
                loadParticipantCounts(
                        sessionIds
                );

        Map<UUID, String>
                creatorEmails =
                loadCreatorEmails(
                        sessionIds
                );

        return sessions.stream()
                .sorted(
                        Comparator.comparing(
                                TrainingSession::getStartAt
                        ).reversed()
                )
                .map(session ->
                        new AdminSessionResponse(

                                session.getId(),

                                session.getTitle(),

                                session.getActivityType(),

                                session.getStatus(),

                                session.getStartAt(),

                                session.getDurationMin(),

                                session.getCapacity(),

                                Math.toIntExact(
                                        participantCounts
                                                .getOrDefault(
                                                        session.getId(),
                                                        0L
                                                )
                                ),

                                session.getGym()
                                        .getName(),

                                creatorEmails
                                        .getOrDefault(
                                                session.getId(),
                                                "Créateur inconnu"
                                        )
                        )
                )
                .toList();
    }

    /*
     * Retrait administratif d'une session.
     *
     * On choisit un "soft removal" :
     * statut CANCELLED.
     *
     * Cela évite de détruire les participations
     * et messages nécessaires à l'historique
     * et à la future modération du chapitre 5.
     */
    @Transactional
    public AdminSessionResponse cancelSession(
            UUID sessionId
    ) {

        TrainingSession session =
                trainingSessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        refreshStatus(session);

        if (
                "CANCELLED".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {
            throw new ConflictException(
                    "Cette session est déjà annulée"
            );
        }

        if (
                "COMPLETED".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {
            throw new BadRequestException(
                    "Une session déjà terminée ne peut plus être retirée"
            );
        }

        session.setStatus(
                "CANCELLED"
        );

        trainingSessionRepository.save(
                session
        );

        long participantCount =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                sessionId
                        );

        String creatorEmail =
                participantRepository
                        .findCreatorsBySessionIds(
                                List.of(sessionId)
                        )
                        .stream()
                        .findFirst()
                        .map(
                                participant ->
                                        participant
                                                .getUser()
                                                .getEmail()
                        )
                        .orElse(
                                "Créateur inconnu"
                        );

        return new AdminSessionResponse(

                session.getId(),

                session.getTitle(),

                session.getActivityType(),

                session.getStatus(),

                session.getStartAt(),

                session.getDurationMin(),

                session.getCapacity(),

                Math.toIntExact(
                        participantCount
                ),

                session.getGym().getName(),

                creatorEmail
        );
    }

    private User findUser(
            UUID userId
    ) {

        return userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Utilisateur introuvable"
                        )
                );
    }

    private AdminUserResponse toUserResponse(
            User user
    ) {

        return new AdminUserResponse(

                user.getId(),

                user.getEmail(),

                user.getRole()
                        .getName(),

                user.isBanned(),

                user.getCreatedAt(),

                user.getLastLoginAt()
        );
    }

    private void refreshStatus(
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
        }
    }

    private Map<UUID, Long>
    loadParticipantCounts(
            List<UUID> sessionIds
    ) {

        Map<UUID, Long> result =
                new HashMap<>();

        participantRepository
                .countParticipantsBySessionIds(
                        sessionIds
                )
                .forEach(row ->
                        result.put(
                                (UUID) row[0],
                                (Long) row[1]
                        )
                );

        return result;
    }

    private Map<UUID, String>
    loadCreatorEmails(
            List<UUID> sessionIds
    ) {

        Map<UUID, String> result =
                new HashMap<>();

        participantRepository
                .findCreatorsBySessionIds(
                        sessionIds
                )
                .forEach(participant ->
                        result.put(
                                participant
                                        .getSession()
                                        .getId(),

                                participant
                                        .getUser()
                                        .getEmail()
                        )
                );

        return result;
    }
}