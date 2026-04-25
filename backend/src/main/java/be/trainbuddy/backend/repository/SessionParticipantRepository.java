package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, UUID> {

    boolean existsBySessionAndUser(TrainingSession session, User user);

    long countBySession(TrainingSession session);

    List<SessionParticipant> findBySession(TrainingSession session);
}