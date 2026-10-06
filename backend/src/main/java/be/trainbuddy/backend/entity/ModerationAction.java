package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "moderation_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /*
     * Signalement ayant provoqué l'action.
     */
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "report_id",
            nullable = false
    )
    private Report report;

    /*
     * Administrateur responsable.
     */
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "admin_user_id",
            nullable = false
    )
    private User admin;

    /*
     * MARK_REVIEWED
     * IGNORE_REPORT
     * CANCEL_SESSION
     * BAN_USER
     */
    @Column(
            name = "action_type",
            nullable = false,
            length = 40
    )
    private String actionType;

    @ManyToOne
    @JoinColumn(
            name = "target_user_id"
    )
    private User targetUser;

    @ManyToOne
    @JoinColumn(
            name = "target_session_id"
    )
    private TrainingSession targetSession;

    @Column(
            columnDefinition = "TEXT"
    )
    private String notes;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;
}