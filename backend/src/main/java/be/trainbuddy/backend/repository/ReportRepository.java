package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.Report;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReportRepository
        extends JpaRepository<Report, UUID> {

    @EntityGraph(
            attributePaths = {
                    "reporter",
                    "reportedUser",
                    "reportedSession",
                    "reviewedBy"
            }
    )
    List<Report> findAllByOrderByCreatedAtDesc();

    @EntityGraph(
            attributePaths = {
                    "reporter",
                    "reportedUser",
                    "reportedSession",
                    "reviewedBy"
            }
    )
    @Query("""
            select r
            from Report r
            where r.id = :id
            """)
    Optional<Report> findDetailedById(
            @Param("id")
            UUID id
    );

    /*
     * Évite qu'un membre spamme plusieurs
     * signalements actifs sur la même session.
     */
    @Query("""
            select count(r)
            from Report r
            where r.reporter.id = :reporterId
              and r.reportedUser is null
              and r.reportedSession.id = :sessionId
              and r.status in :statuses
            """)
    long countActiveSessionReports(

            @Param("reporterId")
            UUID reporterId,

            @Param("sessionId")
            UUID sessionId,

            @Param("statuses")
            Collection<String> statuses
    );

    /*
     * Évite un doublon de signalement
     * sur le même membre dans la même session.
     */
    @Query("""
            select count(r)
            from Report r
            where r.reporter.id = :reporterId
              and r.reportedUser.id = :reportedUserId
              and r.reportedSession.id = :sessionId
              and r.status in :statuses
            """)
    long countActiveUserReports(

            @Param("reporterId")
            UUID reporterId,

            @Param("reportedUserId")
            UUID reportedUserId,

            @Param("sessionId")
            UUID sessionId,

            @Param("statuses")
            Collection<String> statuses
    );
}