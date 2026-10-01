package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.SessionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionParticipantRepository
        extends JpaRepository<SessionParticipant, UUID> {

    boolean existsBySessionIdAndUserId(
            UUID sessionId,
            UUID userId
    );

    Optional<SessionParticipant> findBySessionIdAndUserId(
            UUID sessionId,
            UUID userId
    );

    long countBySessionId(
            UUID sessionId
    );

    List<SessionParticipant> findBySessionIdOrderByJoinedAtAsc(
            UUID sessionId
    );

    boolean existsBySessionIdAndRecognitionCode(
            UUID sessionId,
            String recognitionCode
    );

    @Query("""
            select sp.session.id, count(sp.id)
            from SessionParticipant sp
            where sp.session.id in :sessionIds
            group by sp.session.id
            """)
    List<Object[]> countParticipantsBySessionIds(
            @Param("sessionIds")
            Collection<UUID> sessionIds
    );
}