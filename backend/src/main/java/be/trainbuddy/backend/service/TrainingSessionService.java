package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.MySessionsResponse;
import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ForbiddenException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.GymRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingSessionService {

    private static final double EARTH_RADIUS_KM =
            6371.0088;

    private final TrainingSessionRepository
            trainingSessionRepository;

    private final GymRepository
            gymRepository;

    private final SessionParticipantRepository
            participantRepository;

    private final SessionParticipantService
            participantService;

    /*
     * Liste publique des sessions.
     *
     * Seules les sessions UPCOMING sont exposées
     * dans la page de recherche.
     *
     * Les sessions COMPLETED et CANCELLED restent
     * disponibles dans "Mes sessions" afin de
     * conserver l'historique personnel.
     */
    @Transactional
    public List<TrainingSessionResponse> search(

            String q,
            UUID gymId,
            String activityType,
            LocalDate date,
            boolean availableOnly,
            Double latitude,
            Double longitude,
            Double radiusKm,
            boolean sortByDistance

    ) {

        validateGeolocationParameters(
                latitude,
                longitude,
                radiusKm,
                sortByDistance
        );

        List<TrainingSession> sessions =
                trainingSessionRepository.findAll();

        /*
         * Avant de construire la liste publique,
         * les anciennes sessions UPCOMING dont
         * la durée est dépassée deviennent
         * automatiquement COMPLETED.
         */
        sessions.forEach(
                this::refreshStatus
        );

        Map<UUID, Long> participantCounts =
                loadParticipantCounts(sessions);

        List<SessionWithDistance> results =
                new ArrayList<>();

        for (
                TrainingSession session :
                sessions
        ) {

            /*
             * La page publique sert à découvrir
             * des sessions encore exploitables.
             *
             * On masque donc :
             *
             * COMPLETED
             * CANCELLED
             *
             * Elles restent accessibles dans
             * l'historique personnel.
             */
            if (
                    !"UPCOMING".equalsIgnoreCase(
                            session.getStatus()
                    )
            ) {
                continue;
            }

            long participantCount =
                    participantCounts.getOrDefault(
                            session.getId(),
                            0L
                    );

            int availablePlaces =
                    Math.max(
                            session.getCapacity()
                                    - Math.toIntExact(
                                    participantCount
                            ),
                            0
                    );

            if (
                    !matchesTextQuery(
                            session,
                            q
                    )
            ) {
                continue;
            }

            if (
                    gymId != null
                            && !gymId.equals(
                            session.getGym().getId()
                    )
            ) {
                continue;
            }

            if (
                    activityType != null
                            && !activityType.isBlank()
                            && !session
                            .getActivityType()
                            .equalsIgnoreCase(
                                    activityType.trim()
                            )
            ) {
                continue;
            }

            if (
                    date != null
                            && !session
                            .getStartAt()
                            .toLocalDate()
                            .equals(date)
            ) {
                continue;
            }

            /*
             * Si l'utilisateur coche
             * "places disponibles uniquement",
             * les sessions UPCOMING déjà pleines
             * sont également masquées.
             */
            if (
                    availableOnly
                            && availablePlaces <= 0
            ) {
                continue;
            }

            Double distanceKm =
                    calculateDistanceKm(
                            latitude,
                            longitude,
                            session.getGym()
                    );

            if (radiusKm != null) {

                if (
                        distanceKm == null
                                || distanceKm > radiusKm
                ) {
                    continue;
                }
            }

            results.add(
                    new SessionWithDistance(
                            session,
                            participantCount,
                            distanceKm
                    )
            );
        }

        Comparator<SessionWithDistance>
                comparator;

        /*
         * Si la géolocalisation est active :
         * plus proche d'abord.
         */
        if (
                sortByDistance
                        && latitude != null
                        && longitude != null
        ) {

            comparator =
                    Comparator
                            .comparing(
                                    SessionWithDistance::distanceKm,
                                    Comparator.nullsLast(
                                            Double::compareTo
                                    )
                            )
                            .thenComparing(
                                    item ->
                                            item.session()
                                                    .getStartAt()
                            );

        } else {

            /*
             * Sans géolocalisation :
             * prochaine session d'abord.
             */
            comparator =
                    Comparator.comparing(
                            item ->
                                    item.session()
                                            .getStartAt()
                    );
        }

        return results.stream()
                .sorted(comparator)
                .map(item ->
                        toResponse(
                                item.session(),
                                item.participantCount(),
                                item.distanceKm()
                        )
                )
                .toList();
    }

    @Transactional
    public TrainingSessionResponse findById(
            UUID id
    ) {

        TrainingSession session =
                trainingSessionRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session d'entraînement introuvable"
                                )
                        );

        refreshStatus(session);

        long participantCount =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                id
                        );

        return toResponse(
                session,
                participantCount,
                null
        );
    }

    /*
     * Historique personnel.
     *
     * Ici on conserve volontairement :
     *
     * UPCOMING
     * COMPLETED
     * CANCELLED
     *
     * afin que le membre retrouve les sessions
     * auxquelles il est personnellement lié.
     */
    @Transactional
    public MySessionsResponse getMySessions(
            User currentUser
    ) {

        List<SessionParticipant>
                participations =
                participantRepository
                        .findActiveByUserIdWithSession(
                                currentUser.getId()
                        );

        List<TrainingSession> sessions =
                participations.stream()
                        .map(
                                SessionParticipant::getSession
                        )
                        .toList();

        sessions.forEach(
                this::refreshStatus
        );

        Map<UUID, Long> participantCounts =
                loadParticipantCounts(sessions);

        List<TrainingSessionResponse>
                created =
                participations.stream()
                        .filter(
                                SessionParticipant::isCreator
                        )
                        .map(participant ->
                                toResponse(
                                        participant.getSession(),

                                        participantCounts
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        0L
                                                ),

                                        null
                                )
                        )
                        .toList();

        List<TrainingSessionResponse>
                joined =
                participations.stream()
                        .filter(
                                participant ->
                                        !participant.isCreator()
                        )
                        .map(participant ->
                                toResponse(
                                        participant.getSession(),

                                        participantCounts
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        0L
                                                ),

                                        null
                                )
                        )
                        .toList();

        return new MySessionsResponse(
                created,
                joined
        );
    }

    @Transactional
    public TrainingSessionResponse create(

            TrainingSessionRequest request,
            User currentUser

    ) {

        Gym gym =
                gymRepository
                        .findById(
                                request.gymId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Salle de sport introuvable"
                                )
                        );

        TrainingSession session =
                TrainingSession.builder()

                        .gym(gym)

                        .title(
                                request.title()
                        )

                        .activityType(
                                request.activityType()
                        )

                        .description(
                                request.description()
                        )

                        .startAt(
                                request.startAt()
                        )

                        .durationMin(
                                request.durationMin()
                        )

                        .capacity(
                                request.capacity()
                        )

                        .status(
                                "UPCOMING"
                        )

                        .visibility(
                                request.visibility()
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .build();

        TrainingSession savedSession =
                trainingSessionRepository
                        .save(session);

        participantService.registerCreator(
                savedSession,
                currentUser
        );

        return toResponse(
                savedSession,
                1,
                null
        );
    }

    /*
     * Annulation par le créateur uniquement.
     */
    @Transactional
    public TrainingSessionResponse cancelSession(
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

        refreshStatus(session);

        boolean creator =
                participantRepository
                        .existsBySessionIdAndUserIdAndCreatorTrueAndLeftAtIsNull(
                                sessionId,
                                currentUser.getId()
                        );

        if (!creator) {

            throw new ForbiddenException(
                    "Seul le créateur peut annuler cette session"
            );
        }

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
                    "Une session terminée ne peut plus être annulée"
            );
        }

        session.setStatus(
                "CANCELLED"
        );

        trainingSessionRepository.save(session);

        long participantCount =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                sessionId
                        );

        return toResponse(
                session,
                participantCount,
                null
        );
    }

    /*
     * Une session UPCOMING devient automatiquement
     * COMPLETED lorsque son heure de fin est passée.
     */
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
            List<TrainingSession> sessions
    ) {

        if (sessions.isEmpty()) {
            return Map.of();
        }

        List<UUID> ids =
                sessions.stream()
                        .map(
                                TrainingSession::getId
                        )
                        .distinct()
                        .toList();

        Map<UUID, Long> counts =
                new HashMap<>();

        List<Object[]> rows =
                participantRepository
                        .countParticipantsBySessionIds(
                                ids
                        );

        for (Object[] row : rows) {

            UUID sessionId =
                    (UUID) row[0];

            Long count =
                    (Long) row[1];

            counts.put(
                    sessionId,
                    count
            );
        }

        return counts;
    }

    private boolean matchesTextQuery(

            TrainingSession session,
            String query

    ) {

        if (
                query == null
                        || query.isBlank()
        ) {
            return true;
        }

        String searchableText =
                String.join(
                                " ",
                                safe(
                                        session.getTitle()
                                ),
                                safe(
                                        session.getActivityType()
                                ),
                                safe(
                                        session.getDescription()
                                ),
                                safe(
                                        session.getGym()
                                                .getName()
                                ),
                                safe(
                                        session.getGym()
                                                .getAddress()
                                )
                        )
                        .toLowerCase(
                                Locale.ROOT
                        );

        String[] terms =
                query
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        )
                        .split("\\s+");

        for (String term : terms) {

            if (term.isBlank()) {
                continue;
            }

            if (
                    term.startsWith("-")
                            && term.length() > 1
            ) {

                String excluded =
                        term.substring(1);

                if (
                        searchableText.contains(
                                excluded
                        )
                ) {
                    return false;
                }

            } else {

                if (
                        !searchableText.contains(
                                term
                        )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private Double calculateDistanceKm(

            Double userLatitude,
            Double userLongitude,
            Gym gym

    ) {

        if (
                userLatitude == null
                        || userLongitude == null
        ) {
            return null;
        }

        BigDecimal gymLatitudeValue =
                gym.getLatitude();

        BigDecimal gymLongitudeValue =
                gym.getLongitude();

        if (
                gymLatitudeValue == null
                        || gymLongitudeValue == null
        ) {
            return null;
        }

        double gymLatitude =
                gymLatitudeValue
                        .doubleValue();

        double gymLongitude =
                gymLongitudeValue
                        .doubleValue();

        double latitudeDifference =
                Math.toRadians(
                        gymLatitude
                                - userLatitude
                );

        double longitudeDifference =
                Math.toRadians(
                        gymLongitude
                                - userLongitude
                );

        double a =
                Math.sin(
                        latitudeDifference / 2
                )
                        * Math.sin(
                        latitudeDifference / 2
                )

                        + Math.cos(
                        Math.toRadians(
                                userLatitude
                        )
                )

                        * Math.cos(
                        Math.toRadians(
                                gymLatitude
                        )
                )

                        * Math.sin(
                        longitudeDifference / 2
                )

                        * Math.sin(
                        longitudeDifference / 2
                );

        double c =
                2
                        * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        double distance =
                EARTH_RADIUS_KM * c;

        return Math.round(
                distance * 100.0
        ) / 100.0;
    }

    private void validateGeolocationParameters(

            Double latitude,
            Double longitude,
            Double radiusKm,
            boolean sortByDistance

    ) {

        if (
                (latitude == null)
                        != (longitude == null)
        ) {

            throw new BadRequestException(
                    "La latitude et la longitude doivent être fournies ensemble"
            );
        }

        if (
                latitude != null
                        && (
                        latitude < -90
                                || latitude > 90
                )
        ) {

            throw new BadRequestException(
                    "La latitude doit être comprise entre -90 et 90"
            );
        }

        if (
                longitude != null
                        && (
                        longitude < -180
                                || longitude > 180
                )
        ) {

            throw new BadRequestException(
                    "La longitude doit être comprise entre -180 et 180"
            );
        }

        if (radiusKm != null) {

            if (
                    latitude == null
                            || longitude == null
            ) {

                throw new BadRequestException(
                        "Une position est nécessaire pour filtrer par rayon"
                );
            }

            if (
                    radiusKm <= 0
                            || radiusKm > 200
            ) {

                throw new BadRequestException(
                        "Le rayon doit être supérieur à 0 et inférieur ou égal à 200 km"
                );
            }
        }

        if (
                sortByDistance
                        && (
                        latitude == null
                                || longitude == null
                )
        ) {

            throw new BadRequestException(
                    "Une position est nécessaire pour trier par distance"
            );
        }
    }

    private TrainingSessionResponse toResponse(

            TrainingSession session,
            long participantCount,
            Double distanceKm

    ) {

        int participantCountValue =
                Math.toIntExact(
                        participantCount
                );

        int availablePlaces =
                Math.max(
                        session.getCapacity()
                                - participantCountValue,
                        0
                );

        return new TrainingSessionResponse(

                session.getId(),

                session.getTitle(),

                session.getActivityType(),

                session.getDescription(),

                session.getStartAt(),

                session.getDurationMin(),

                session.getCapacity(),

                session.getStatus(),

                session.getVisibility(),

                session.getGym()
                        .getId(),

                session.getGym()
                        .getName(),

                participantCountValue,

                availablePlaces,

                distanceKm
        );
    }

    private String safe(
            String value
    ) {

        return value == null
                ? ""
                : value;
    }

    private record SessionWithDistance(

            TrainingSession session,

            long participantCount,

            Double distanceKm

    ) {
    }
}