package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.MySessionsResponse;
import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.SubscriptionPlan;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingSessionService {

    private static final double
            EARTH_RADIUS_KM =
            6371.0088;

    private final TrainingSessionRepository
            trainingSessionRepository;

    private final GymRepository
            gymRepository;

    private final SessionParticipantRepository
            participantRepository;

    private final SessionParticipantService
            participantService;

    private final SubscriptionService
            subscriptionService;

    /*
     * =========================
     * RECHERCHE PUBLIQUE
     * =========================
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
            boolean sortByDistance,
            User currentUser

    ) {

        validateSearchParameters(

                q,

                latitude,

                longitude,

                radiusKm,

                sortByDistance,

                currentUser
        );

        List<TrainingSession> sessions =
                trainingSessionRepository
                        .findAll();

        sessions.forEach(
                this::refreshStatus
        );

        Map<UUID, Long> participantCounts =
                loadParticipantCounts(
                        sessions
                );

        Map<UUID, Boolean> premiumFlags =
                loadPremiumFlags(
                        sessions
                );

        List<SessionWithDistance> results =
                new ArrayList<>();

        for (
                TrainingSession session :
                sessions
        ) {

            /*
             * Une session terminée ou annulée
             * n'a aucun intérêt dans la
             * recherche publique.
             */
            if (
                    !"UPCOMING"
                            .equalsIgnoreCase(
                                    session.getStatus()
                            )
            ) {
                continue;
            }

            long participantCount =
                    participantCounts
                            .getOrDefault(
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
                            session
                                    .getGym()
                                    .getId()
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

            if (
                    radiusKm != null
                            && (
                            distanceKm == null
                                    || distanceKm
                                    > radiusKm
                    )
            ) {
                continue;
            }

            results.add(

                    new SessionWithDistance(

                            session,

                            participantCount,

                            distanceKm,

                            premiumFlags
                                    .getOrDefault(
                                            session.getId(),
                                            false
                                    )
                    )
            );
        }

        /*
         * Une session créée par un membre
         * Premium bénéficie d'une meilleure
         * position.
         *
         * Ensuite seulement viennent
         * proximité/date.
         */
        Comparator<SessionWithDistance>
                premiumFirst =
                Comparator
                        .comparing(
                                SessionWithDistance
                                        ::premiumHighlighted
                        )
                        .reversed();

        Comparator<SessionWithDistance>
                normalOrder;

        if (
                sortByDistance
                        && latitude != null
                        && longitude != null
        ) {

            normalOrder =
                    Comparator
                            .comparing(
                                    SessionWithDistance
                                            ::distanceKm,

                                    Comparator
                                            .nullsLast(
                                                    Double::compareTo
                                            )
                            )

                            .thenComparing(
                                    item ->
                                            item
                                                    .session()
                                                    .getStartAt()
                            );

        } else {

            normalOrder =
                    Comparator.comparing(
                            item ->
                                    item
                                            .session()
                                            .getStartAt()
                    );
        }

        return results
                .stream()

                .sorted(
                        premiumFirst
                                .thenComparing(
                                        normalOrder
                                )
                )

                .map(item ->
                        toResponse(

                                item.session(),

                                item.participantCount(),

                                item.distanceKm(),

                                item.premiumHighlighted()
                        )
                )

                .toList();
    }

    /*
     * =========================
     * DETAIL
     * =========================
     */

    @Transactional
    public TrainingSessionResponse
    findById(
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

        refreshStatus(
                session
        );

        long participantCount =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                id
                        );

        boolean premium =
                loadPremiumFlags(
                        List.of(
                                session
                        )
                )
                        .getOrDefault(
                                id,
                                false
                        );

        return toResponse(

                session,

                participantCount,

                null,

                premium
        );
    }

    /*
     * =========================
     * MES SESSIONS
     * =========================
     */

    @Transactional
    public MySessionsResponse
    getMySessions(
            User currentUser
    ) {

        List<SessionParticipant>
                participations =
                participantRepository
                        .findActiveByUserIdWithSession(
                                currentUser.getId()
                        );

        List<TrainingSession> sessions =
                participations
                        .stream()

                        .map(
                                SessionParticipant
                                        ::getSession
                        )

                        .toList();

        sessions.forEach(
                this::refreshStatus
        );

        Map<UUID, Long> participantCounts =
                loadParticipantCounts(
                        sessions
                );

        Map<UUID, Boolean> premiumFlags =
                loadPremiumFlags(
                        sessions
                );

        List<TrainingSessionResponse>
                created =
                participations
                        .stream()

                        .filter(
                                SessionParticipant
                                        ::isCreator
                        )

                        .map(participant ->
                                toResponse(

                                        participant
                                                .getSession(),

                                        participantCounts
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        0L
                                                ),

                                        null,

                                        premiumFlags
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        false
                                                )
                                )
                        )

                        .toList();

        List<TrainingSessionResponse>
                joined =
                participations
                        .stream()

                        .filter(participant ->
                                !participant.isCreator()
                        )

                        .map(participant ->
                                toResponse(

                                        participant
                                                .getSession(),

                                        participantCounts
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        0L
                                                ),

                                        null,

                                        premiumFlags
                                                .getOrDefault(
                                                        participant
                                                                .getSession()
                                                                .getId(),
                                                        false
                                                )
                                )
                        )

                        .toList();

        return new MySessionsResponse(

                created,

                joined
        );
    }

    /*
     * =========================
     * CREATION + LIMITES PREMIUM
     * =========================
     */

    @Transactional
    public TrainingSessionResponse create(

            TrainingSessionRequest request,

            User currentUser

    ) {

        SubscriptionPlan plan =
                subscriptionService
                        .getEffectivePlan(
                                currentUser
                        );

        validateCreationLimits(

                request,

                currentUser,

                plan
        );

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

        if (!gym.isActive()) {

            throw new BadRequestException(
                    "Cette salle n'est actuellement pas disponible"
            );
        }

        TrainingSession session =
                TrainingSession.builder()

                        .gym(
                                gym
                        )

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
                        .save(
                                session
                        );

        participantService
                .registerCreator(

                        savedSession,

                        currentUser
                );

        return toResponse(

                savedSession,

                1,

                null,

                plan.isHighlightedSessions()
        );
    }

    /*
     * =========================
     * ANNULATION
     * =========================
     */

    @Transactional
    public TrainingSessionResponse
    cancelSession(

            UUID sessionId,

            User currentUser

    ) {

        TrainingSession session =
                trainingSessionRepository
                        .findById(
                                sessionId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        refreshStatus(
                session
        );

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
                "CANCELLED"
                        .equalsIgnoreCase(
                                session.getStatus()
                        )
        ) {

            throw new ConflictException(
                    "Cette session est déjà annulée"
            );
        }

        if (
                "COMPLETED"
                        .equalsIgnoreCase(
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

        trainingSessionRepository.save(
                session
        );

        long participantCount =
                participantRepository
                        .countBySessionIdAndLeftAtIsNull(
                                sessionId
                        );

        boolean premium =
                loadPremiumFlags(
                        List.of(
                                session
                        )
                )
                        .getOrDefault(
                                sessionId,
                                false
                        );

        return toResponse(

                session,

                participantCount,

                null,

                premium
        );
    }

    /*
     * =========================
     * REGLES PREMIUM
     * =========================
     */

    private void validateCreationLimits(

            TrainingSessionRequest request,

            User currentUser,

            SubscriptionPlan plan

    ) {

        if (
                request.startAt()
                        .isBefore(
                                LocalDateTime.now()
                        )
        ) {

            throw new BadRequestException(
                    "La session doit être planifiée dans le futur"
            );
        }

        if (
                request.capacity()
                        > plan.getMaxCapacity()
        ) {

            throw new BadRequestException(

                    "Votre plan "
                            + plan.getCode()
                            + " autorise une capacité maximale de "
                            + plan.getMaxCapacity()
                            + " participants"
            );
        }

        List<SessionParticipant>
                participations =
                participantRepository
                        .findActiveByUserIdWithSession(
                                currentUser.getId()
                        );

        participations.forEach(
                participant ->
                        refreshStatus(
                                participant
                                        .getSession()
                        )
        );

        long activeCreatedSessions =
                participations
                        .stream()

                        .filter(
                                SessionParticipant
                                        ::isCreator
                        )

                        .filter(participant ->
                                "UPCOMING"
                                        .equalsIgnoreCase(
                                                participant
                                                        .getSession()
                                                        .getStatus()
                                        )
                        )

                        .count();

        if (
                activeCreatedSessions
                        >= plan
                        .getMaxActiveSessions()
        ) {

            throw new BadRequestException(

                    "Votre plan "
                            + plan.getCode()
                            + " autorise au maximum "
                            + plan.getMaxActiveSessions()
                            + " sessions actives créées simultanément"
            );
        }
    }

    private void validateSearchParameters(

            String q,

            Double latitude,

            Double longitude,

            Double radiusKm,

            boolean sortByDistance,

            User currentUser

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

        if (
                radiusKm != null
                        && (
                        latitude == null
                                || longitude == null
                )
        ) {

            throw new BadRequestException(
                    "Une position est nécessaire pour filtrer par rayon"
            );
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

        SubscriptionPlan plan =
                subscriptionService
                        .getEffectivePlan(
                                currentUser
                        );

        double maximumRadius =
                plan.isAdvancedFilters()
                        ? 200
                        : 25;

        if (
                radiusKm != null
                        && (
                        radiusKm <= 0
                                || radiusKm
                                > maximumRadius
                )
        ) {

            if (
                    !plan.isAdvancedFilters()
                            && radiusKm > 25
            ) {

                throw new BadRequestException(
                        "Les rayons supérieurs à 25 km sont réservés aux membres Premium"
                );
            }

            throw new BadRequestException(
                    "Le rayon doit être supérieur à 0 et inférieur ou égal à "
                            + (int) maximumRadius
                            + " km"
            );
        }

        if (
                containsExclusionTerm(
                        q
                )
                        && !plan
                        .isAdvancedFilters()
        ) {

            throw new BadRequestException(
                    "La recherche avancée avec -mot est réservée aux membres Premium"
            );
        }
    }

    private boolean containsExclusionTerm(
            String q
    ) {

        if (
                q == null
                        || q.isBlank()
        ) {
            return false;
        }

        return Arrays
                .stream(
                        q.trim()
                                .split(
                                        "\\s+"
                                )
                )

                .anyMatch(term ->
                        term.startsWith("-")
                                && term.length()
                                > 1
                );
    }

    /*
     * =========================
     * PREMIUM DES CREATEURS
     * =========================
     */

    private Map<UUID, Boolean>
    loadPremiumFlags(
            List<TrainingSession> sessions
    ) {

        if (
                sessions == null
                        || sessions.isEmpty()
        ) {
            return Map.of();
        }

        List<UUID> sessionIds =
                sessions
                        .stream()

                        .map(
                                TrainingSession
                                        ::getId
                        )

                        .distinct()

                        .toList();

        List<SessionParticipant>
                creators =
                participantRepository
                        .findCreatorsBySessionIds(
                                sessionIds
                        );

        if (creators.isEmpty()) {
            return Map.of();
        }

        Set<UUID> creatorUserIds =
                creators
                        .stream()

                        .map(participant ->
                                participant
                                        .getUser()
                                        .getId()
                        )

                        .collect(
                                Collectors.toSet()
                        );

        Set<UUID> premiumUserIds =
                subscriptionService
                        .findPremiumUserIds(
                                creatorUserIds
                        );

        Map<UUID, Boolean> result =
                new HashMap<>();

        for (
                SessionParticipant creator :
                creators
        ) {

            result.put(

                    creator
                            .getSession()
                            .getId(),

                    premiumUserIds.contains(
                            creator
                                    .getUser()
                                    .getId()
                    )
            );
        }

        return result;
    }

    /*
     * =========================
     * STATUTS
     * =========================
     */

    private void refreshStatus(
            TrainingSession session
    ) {

        if (
                !"UPCOMING"
                        .equalsIgnoreCase(
                                session.getStatus()
                        )
        ) {
            return;
        }

        LocalDateTime endAt =
                session
                        .getStartAt()
                        .plusMinutes(
                                session
                                        .getDurationMin()
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

    /*
     * =========================
     * PARTICIPANTS
     * =========================
     */

    private Map<UUID, Long>
    loadParticipantCounts(
            List<TrainingSession> sessions
    ) {

        if (
                sessions == null
                        || sessions.isEmpty()
        ) {
            return Map.of();
        }

        List<UUID> ids =
                sessions
                        .stream()

                        .map(
                                TrainingSession
                                        ::getId
                        )

                        .distinct()

                        .toList();

        Map<UUID, Long> counts =
                new HashMap<>();

        participantRepository
                .countParticipantsBySessionIds(
                        ids
                )
                .forEach(row ->
                        counts.put(

                                (UUID) row[0],

                                (Long) row[1]
                        )
                );

        return counts;
    }

    /*
     * =========================
     * RECHERCHE TEXTE
     * =========================
     */

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
                                        session
                                                .getActivityType()
                                ),

                                safe(
                                        session
                                                .getDescription()
                                ),

                                safe(
                                        session
                                                .getGym()
                                                .getName()
                                ),

                                safe(
                                        session
                                                .getGym()
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

                        .split(
                                "\\s+"
                        );

        for (
                String term :
                terms
        ) {

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
                        searchableText
                                .contains(
                                        excluded
                                )
                ) {
                    return false;
                }

            } else {

                if (
                        !searchableText
                                .contains(
                                        term
                                )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /*
     * =========================
     * DISTANCE
     * =========================
     */

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

    /*
     * =========================
     * DTO
     * =========================
     */

    private TrainingSessionResponse
    toResponse(

            TrainingSession session,

            long participantCount,

            Double distanceKm,

            boolean premiumHighlighted

    ) {

        int count =
                Math.toIntExact(
                        participantCount
                );

        int availablePlaces =
                Math.max(

                        session.getCapacity()
                                - count,

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

                session
                        .getGym()
                        .getId(),

                session
                        .getGym()
                        .getName(),

                count,

                availablePlaces,

                distanceKm,

                premiumHighlighted
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

            Double distanceKm,

            boolean premiumHighlighted

    ) {
    }
}