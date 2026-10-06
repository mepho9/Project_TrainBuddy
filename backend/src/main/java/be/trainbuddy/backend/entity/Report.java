package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /*
     * Membre ayant créé le signalement.
     */
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "reporter_user_id",
            nullable = false
    )
    private User reporter;

    /*
     * Utilisateur concerné.
     *
     * null si le signalement concerne
     * directement une session.
     */
    @ManyToOne
    @JoinColumn(
            name = "reported_user_id"
    )
    private User reportedUser;

    /*
     * Session concernée.
     *
     * Pour un signalement d'utilisateur,
     * elle sert également de contexte :
     * "cet utilisateur dans cette session".
     */
    @ManyToOne
    @JoinColumn(
            name = "reported_session_id"
    )
    private TrainingSession reportedSession;

    @Column(
            nullable = false,
            length = 80
    )
    private String reason;

    @Column(
            columnDefinition = "TEXT"
    )
    private String details;

    /*
     * OPEN
     * REVIEWED
     * CLOSED
     */
    @Column(
            nullable = false,
            length = 20
    )
    private String status;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    /*
     * Date de première prise en charge
     * par un administrateur.
     */
    @Column(
            name = "reviewed_at"
    )
    private LocalDateTime reviewedAt;

    /*
     * Administrateur ayant pris
     * le signalement en charge.
     */
    @ManyToOne
    @JoinColumn(
            name = "reviewed_by_user_id"
    )
    private User reviewedBy;
}