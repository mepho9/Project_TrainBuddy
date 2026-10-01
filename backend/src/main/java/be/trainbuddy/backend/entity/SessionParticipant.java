package be.trainbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "session_participants",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"session_id", "user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @Column(nullable = false, length = 20)
    private String recognitionCode;

    @Column(nullable = false)
    private boolean creator;

    /*
     * null = participation active.
     *
     * Une date signifie que le membre
     * a quitté la session.
     *
     * Nous conservons la participation
     * plutôt que de la supprimer afin de
     * préserver l'historique du chat.
     */
    @Column(name = "left_at")
    private LocalDateTime leftAt;
}