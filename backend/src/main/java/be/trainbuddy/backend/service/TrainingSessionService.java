package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
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

    @Transactional(readOnly = true)
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

        Map<UUID, Long> participantCounts =
                loadParticipantCounts(sessions);

        List<SessionWithDistance> results =
                new ArrayList<>();

        for (TrainingSession session : sessions) {

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

            /*
             * Recherche textuelle.
             *
             * Exemple :
             * musculation basic
             *
             * Les deux mots doivent être trouvés.
             *
             * Exemple :
             * musculation -cardio
             *
             * "cardio" devient un mot à exclure.
             */
            if (!matchesTextQuery(
                    session,
                    q
            )) {
                continue;
            }

            /*
             * Filtre par salle.
             */
            if (
                    gymId != null
                            && !gymId.equals(
                            session.getGym().getId()
                    )
            ) {
                continue;
            }

            /*
             * Filtre par activité.
             */
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

            /*
             * Filtre par date.
             */
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
             * Sessions possédant encore
             * des places.
             *
             * On considère également
             * qu'une session doit être
             * UPCOMING.
             */
            if (
                    availableOnly
                            && (
                            !"UPCOMING".equalsIgnoreCase(
                                    session.getStatus()
                            )
                                    || availablePlaces <= 0
                    )
            ) {
                continue;
            }

            /*
             * Calcul éventuel de la distance.
             */
            Double distanceKm =
                    calculateDistanceKm(
                            latitude,
                            longitude,
                            session.getGym()
                    );

            /*
             * Si un rayon est demandé,
             * on retire les salles
             * trop éloignées.
             *
             * Une salle sans coordonnées
             * ne peut pas être considérée
             * comme étant dans le rayon.
             */
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
         * Si la géolocalisation est utilisée,
         * le résultat est trié du plus proche
         * au plus éloigné.
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
             * Sinon, tri chronologique.
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

    @Transactional(readOnly = true)
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

        long participantCount =
                participantRepository
                        .countBySessionId(id);

        return toResponse(
                session,
                participantCount,
                null
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

        /*
         * Le créateur devient automatiquement
         * le premier participant.
         */
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
     * Récupération du nombre de participants
     * pour toutes les sessions en une seule fois.
     */
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

    /*
     * Recherche textuelle.
     *
     * On recherche dans :
     *
     * titre
     * activité
     * description
     * nom de la salle
     * adresse de la salle
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

            /*
             * "-cardio" signifie :
             * exclure les résultats
             * contenant cardio.
             */
            if (
                    term.startsWith("-")
                            && term.length() > 1
            ) {

                String excluded =
                        term.substring(1);

                if (
                        searchableText
                                .contains(excluded)
                ) {
                    return false;
                }

            } else {

                /*
                 * Tous les termes positifs
                 * doivent apparaître.
                 */
                if (
                        !searchableText
                                .contains(term)
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /*
     * Calcul de distance selon
     * la formule de Haversine.
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

        /*
         * Deux décimales suffisent
         * pour l'affichage.
         */
        return Math.round(
                distance * 100.0
        ) / 100.0;
    }

    /*
     * Validation des paramètres
     * reçus par l'API.
     */
    private void validateGeolocationParameters(

            Double latitude,
            Double longitude,
            Double radiusKm,
            boolean sortByDistance

    ) {

        /*
         * Impossible de fournir seulement
         * une latitude ou seulement
         * une longitude.
         */
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

    /*
     * Objet interne uniquement utilisé
     * pendant le calcul de recherche.
     */
    private record SessionWithDistance(

            TrainingSession session,

            long participantCount,

            Double distanceKm

    ) {
    }
}