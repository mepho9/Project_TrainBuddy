package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "members_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProfile {

    /*
     * Le schéma TrainBuddy prévoit user_id
     * comme clé primaire du profil membre.
     */
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(optional = false)
    @MapsId
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @Column(
            name = "display_language",
            nullable = false,
            length = 10
    )
    private String displayLanguage;

    @Column(
            name = "sessions_created_limit",
            nullable = false
    )
    private int sessionsCreatedLimit;

    @Column(
            length = 255
    )
    private String goals;

    @Column(
            name = "availability_text",
            length = 255
    )
    private String availabilityText;

    /*
     * Extension permettant d'enregistrer
     * les préférences sportives prévues
     * dans le cahier des charges.
     */
    @Column(
            name = "sports_preferences",
            columnDefinition = "TEXT"
    )
    private String sportsPreferences;
}