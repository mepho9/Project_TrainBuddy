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

    boolean existsBySessionIdAndUserIdAndLeftAtIsNull(
            UUID sessionId,
            UUID userId
    );

    Optional<SessionParticipant>
    findBySessionIdAndUserIdAndLeftAtIsNull(
            UUID sessionId,
            UUID userId
    );

    Optional<SessionParticipant>
    findBySessionIdAndUserId(
            UUID sessionId,
            UUID userId
    );

    long countBySessionIdAndLeftAtIsNull(
            UUID sessionId
    );

    List<SessionParticipant>
    findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(
            UUID sessionId
    );

    boolean existsBySessionIdAndRecognitionCode(
            UUID sessionId,
            String recognitionCode
    );

    boolean existsBySessionIdAndUserIdAndCreatorTrueAndLeftAtIsNull(
            UUID sessionId,
            UUID userId
    );

    @Query("""
            select sp.session.id, count(sp.id)
            from SessionParticipant sp
            where sp.session.id in :sessionIds
              and sp.leftAt is null
            group by sp.session.id
            """)
    List<Object[]> countParticipantsBySessionIds(
            @Param("sessionIds")
            Collection<UUID> sessionIds
    );

    @Query("""
            select sp
            from SessionParticipant sp
            join fetch sp.session s
            join fetch s.gym
            where sp.user.id = :userId
              and sp.leftAt is null
            order by s.startAt desc
            """)
    List<SessionParticipant>
    findActiveByUserIdWithSession(
            @Param("userId")
            UUID userId
    );

    /*
     * Utilisé dans le back-office afin de
     * retrouver le créateur réel de chaque session.
     *
     * On ne filtre pas sur leftAt car l'administrateur
     * doit pouvoir retrouver le créateur historique
     * même après un bannissement.
     */
    @Query("""
            select sp
            from SessionParticipant sp
            join fetch sp.user
            where sp.creator = true
              and sp.session.id in :sessionIds
            """)
    List<SessionParticipant>
    findCreatorsBySessionIds(
            @Param("sessionIds")
            Collection<UUID> sessionIds
    );
}