package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.GymResponse;
import be.trainbuddy.backend.dto.MemberProfileResponse;
import be.trainbuddy.backend.dto.MemberProfileUpdateRequest;
import be.trainbuddy.backend.entity.FavoriteGym;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.entity.MemberProfile;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.entity.UserSubscription;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.FavoriteGymRepository;
import be.trainbuddy.backend.repository.GymRepository;
import be.trainbuddy.backend.repository.MemberProfileRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import be.trainbuddy.backend.repository.UserRepository;
import be.trainbuddy.backend.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Set<String> ALLOWED_ACTIVITIES =
            Set.of(
                    "Musculation",
                    "Cardio",
                    "Crossfit",
                    "Fitness",
                    "HIIT",
                    "Mobilité"
            );

    private static final Set<String> ALLOWED_LANGUAGES =
            Set.of(
                    "fr",
                    "en",
                    "nl"
            );

    private final MemberProfileRepository profileRepository;

    private final FavoriteGymRepository favoriteGymRepository;

    private final GymRepository gymRepository;

    private final UserRepository userRepository;

    private final SessionParticipantRepository participantRepository;

    private final TrainingSessionRepository trainingSessionRepository;

    private final UserSubscriptionRepository subscriptionRepository;

    private final PasswordEncoder passwordEncoder;

    private final StripeService stripeService;

    private final SubscriptionService subscriptionService;

    /*
     * =========================
     * CONSULTATION DU PROFIL
     * =========================
     */
    @Transactional(readOnly = true)
    public MemberProfileResponse getProfile(
            User user
    ) {

        MemberProfile profile =
                profileRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElse(null);

        return toResponse(
                user,
                profile
        );
    }

    /*
     * =========================
     * MODIFICATION DU PROFIL
     * =========================
     */
    @Transactional
    public MemberProfileResponse updateProfile(
            User user,
            MemberProfileUpdateRequest request
    ) {

        /*
         * L'utilisateur provenant du SecurityContext
         * peut être détaché de la session Hibernate.
         *
         * On recharge donc une instance MANAGED dans
         * la transaction courante avant de créer ou
         * modifier des entités qui y font référence.
         */
        User managedUser =
                getManagedUser(
                        user
                );

        MemberProfile profile =
                getOrCreateProfile(
                        managedUser
                );

        List<String> preferences =
                normalizePreferences(
                        request.sportsPreferences()
                );

        String language =
                request.preferredLanguage()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (
                !ALLOWED_LANGUAGES.contains(
                        language
                )
        ) {
            throw new BadRequestException(
                    "Langue invalide. Valeurs autorisées : fr, en, nl"
            );
        }

        profile.setSportsPreferences(
                String.join(
                        ",",
                        preferences
                )
        );

        profile.setGoals(
                cleanOptionalText(
                        request.goals()
                )
        );

        profile.setAvailabilityText(
                cleanOptionalText(
                        request.availability()
                )
        );

        profile.setDisplayLanguage(
                language
        );

        profile.setSessionsCreatedLimit(
                subscriptionService
                        .getEffectivePlan(
                                managedUser
                        )
                        .getMaxActiveSessions()
        );

        MemberProfile saved =
                profileRepository.save(
                        profile
                );

        return toResponse(
                managedUser,
                saved
        );
    }

    /*
     * =========================
     * SALLES FAVORITES
     * =========================
     */
    @Transactional
    public MemberProfileResponse addFavoriteGym(
            User user,
            UUID gymId
    ) {

        User managedUser =
                getManagedUser(
                        user
                );

        Gym gym =
                gymRepository
                        .findById(
                                gymId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Salle de sport introuvable"
                                )
                        );

        if (!gym.isActive()) {
            throw new BadRequestException(
                    "Cette salle n'est plus active"
            );
        }

        if (
                favoriteGymRepository
                        .existsByUserIdAndGymId(
                                managedUser.getId(),
                                gymId
                        )
        ) {
            throw new ConflictException(
                    "Cette salle est déjà dans vos favoris"
            );
        }

        /*
         * managedUser est attaché à la transaction.
         * Hibernate peut donc créer FavoriteGym
         * proprement sans erreur detached entity.
         */
        favoriteGymRepository.save(
                FavoriteGym.builder()
                        .user(
                                managedUser
                        )
                        .gym(
                                gym
                        )
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .build()
        );

        return getProfile(
                managedUser
        );
    }

    @Transactional
    public MemberProfileResponse removeFavoriteGym(
            User user,
            UUID gymId
    ) {

        User managedUser =
                getManagedUser(
                        user
                );

        if (
                !favoriteGymRepository
                        .existsByUserIdAndGymId(
                                managedUser.getId(),
                                gymId
                        )
        ) {
            throw new ResourceNotFoundException(
                    "Cette salle n'est pas dans vos favoris"
            );
        }

        favoriteGymRepository
                .deleteByUserIdAndGymId(
                        managedUser.getId(),
                        gymId
                );

        return getProfile(
                managedUser
        );
    }

    /*
     * =========================
     * MOT DE PASSE
     * =========================
     */
    @Transactional
    public void changePassword(
            User user,
            String currentPassword,
            String newPassword
    ) {

        User managedUser =
                getManagedUser(
                        user
                );

        if (
                !passwordEncoder.matches(
                        currentPassword,
                        managedUser.getPasswordHash()
                )
        ) {
            throw new BadRequestException(
                    "Le mot de passe actuel est incorrect"
            );
        }

        if (
                passwordEncoder.matches(
                        newPassword,
                        managedUser.getPasswordHash()
                )
        ) {
            throw new BadRequestException(
                    "Le nouveau mot de passe doit être différent de l'ancien"
            );
        }

        managedUser.setPasswordHash(
                passwordEncoder.encode(
                        newPassword
                )
        );

        userRepository.save(
                managedUser
        );
    }

    /*
     * =========================
     * SUPPRESSION DU COMPTE
     * =========================
     */
    @Transactional
    public void deleteAccount(
            User user,
            String currentPassword
    ) {

        User managedUser =
                getManagedUser(
                        user
                );

        if (
                !passwordEncoder.matches(
                        currentPassword,
                        managedUser.getPasswordHash()
                )
        ) {
            throw new BadRequestException(
                    "Le mot de passe actuel est incorrect"
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        UserSubscription subscription =
                subscriptionRepository
                        .findByUserId(
                                managedUser.getId()
                        )
                        .orElse(null);

        /*
         * Si Premium est encore actif,
         * on empêche son renouvellement Stripe.
         */
        if (
                subscription != null
                        && "ACTIVE".equalsIgnoreCase(
                        subscription.getStatus()
                )
        ) {

            if (
                    !subscription.isCancelAtPeriodEnd()
                            && subscription.getStripeSubscriptionId() != null
                            && !subscription
                            .getStripeSubscriptionId()
                            .isBlank()
            ) {

                stripeService
                        .scheduleCancellation(
                                subscription
                        );
            }

            subscription.setCancelAtPeriodEnd(
                    true
            );

            subscription.setUpdatedAt(
                    now
            );

            subscriptionRepository.save(
                    subscription
            );
        }

        /*
         * Les futures sessions créées
         * par le membre sont annulées.
         *
         * Ses participations actives
         * sont ensuite clôturées.
         */
        List<SessionParticipant> participations =
                participantRepository
                        .findActiveByUserIdWithSession(
                                managedUser.getId()
                        );

        List<TrainingSession> sessionsToCancel =
                participations
                        .stream()
                        .filter(
                                SessionParticipant::isCreator
                        )
                        .map(
                                SessionParticipant::getSession
                        )
                        .filter(session ->
                                "UPCOMING".equalsIgnoreCase(
                                        session.getStatus()
                                )
                        )
                        .distinct()
                        .peek(session ->
                                session.setStatus(
                                        "CANCELLED"
                                )
                        )
                        .toList();

        participations.forEach(
                participation ->
                        participation.setLeftAt(
                                now
                        )
        );

        if (
                !sessionsToCancel.isEmpty()
        ) {
            trainingSessionRepository
                    .saveAll(
                            sessionsToCancel
                    );
        }

        if (
                !participations.isEmpty()
        ) {
            participantRepository
                    .saveAll(
                            participations
                    );
        }

        favoriteGymRepository
                .deleteByUserId(
                        managedUser.getId()
                );

        profileRepository
                .deleteByUserId(
                        managedUser.getId()
                );

        /*
         * Soft-delete / anonymisation.
         *
         * L'identifiant technique reste disponible
         * afin de préserver les historiques de chat,
         * paiement et modération.
         */
        managedUser.setEmail(
                "deleted+"
                        + managedUser.getId()
                        + "@trainbuddy.invalid"
        );

        managedUser.setPasswordHash(
                passwordEncoder.encode(
                        UUID.randomUUID()
                                .toString()
                                + UUID.randomUUID()
                )
        );

        managedUser.setBanned(
                true
        );

        managedUser.setLastLoginAt(
                null
        );

        userRepository.save(
                managedUser
        );
    }

    /*
     * =========================
     * UTILISATEUR MANAGED
     * =========================
     */
    private User getManagedUser(
            User user
    ) {

        if (
                user == null
                        || user.getId() == null
        ) {
            throw new ResourceNotFoundException(
                    "Utilisateur introuvable"
            );
        }

        return userRepository
                .findById(
                        user.getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Utilisateur introuvable"
                        )
                );
    }

    /*
     * =========================
     * PROFIL INTERNE
     * =========================
     */
    private MemberProfile getOrCreateProfile(
            User managedUser
    ) {

        return profileRepository
                .findByUserId(
                        managedUser.getId()
                )
                .orElseGet(() -> {

                    /*
                     * managedUser appartient maintenant
                     * à l'EntityManager de cette transaction.
                     *
                     * @MapsId peut donc reprendre son UUID
                     * sans essayer de persister un User détaché.
                     */
                    MemberProfile profile =
                            MemberProfile.builder()
                                    .user(
                                            managedUser
                                    )
                                    .sportsPreferences(
                                            ""
                                    )
                                    .goals(
                                            ""
                                    )
                                    .availabilityText(
                                            ""
                                    )
                                    .displayLanguage(
                                            "fr"
                                    )
                                    .sessionsCreatedLimit(
                                            subscriptionService
                                                    .getEffectivePlan(
                                                            managedUser
                                                    )
                                                    .getMaxActiveSessions()
                                    )
                                    .build();

                    return profileRepository.save(
                            profile
                    );
                });
    }

    private List<String> normalizePreferences(
            List<String> preferences
    ) {

        LinkedHashSet<String> normalized =
                new LinkedHashSet<>();

        for (
                String preference :
                preferences
        ) {

            String value =
                    preference.trim();

            if (
                    !ALLOWED_ACTIVITIES.contains(
                            value
                    )
            ) {
                throw new BadRequestException(
                        "Préférence sportive invalide : "
                                + value
                );
            }

            normalized.add(
                    value
            );
        }

        return List.copyOf(
                normalized
        );
    }

    private String cleanOptionalText(
            String value
    ) {

        if (
                value == null
        ) {
            return "";
        }

        return value.trim();
    }

    private List<String> parsePreferences(
            String value
    ) {

        if (
                value == null
                        || value.isBlank()
        ) {
            return List.of();
        }

        return List.of(
                value.split(",")
        );
    }

    private MemberProfileResponse toResponse(
            User user,
            MemberProfile profile
    ) {

        List<GymResponse> favorites =
                favoriteGymRepository
                        .findByUserIdOrderByGymNameAsc(
                                user.getId()
                        )
                        .stream()
                        .map(
                                FavoriteGym::getGym
                        )
                        .map(
                                this::toGymResponse
                        )
                        .toList();

        if (profile == null) {

            return new MemberProfileResponse(
                    List.of(),
                    "",
                    "",
                    "fr",
                    favorites
            );
        }

        return new MemberProfileResponse(
                parsePreferences(
                        profile.getSportsPreferences()
                ),

                profile.getGoals() == null
                        ? ""
                        : profile.getGoals(),

                profile.getAvailabilityText() == null
                        ? ""
                        : profile.getAvailabilityText(),

                profile.getDisplayLanguage(),

                favorites
        );
    }

    private GymResponse toGymResponse(
            Gym gym
    ) {

        return new GymResponse(
                gym.getId(),
                gym.getName(),
                gym.getType(),
                gym.getAddress(),
                gym.getLatitude(),
                gym.getLongitude(),
                gym.isActive()
        );
    }
}