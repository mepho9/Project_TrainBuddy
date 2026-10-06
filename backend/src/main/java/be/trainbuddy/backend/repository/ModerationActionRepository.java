package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.ModerationAction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ModerationActionRepository
        extends JpaRepository<ModerationAction, UUID> {

    @EntityGraph(
            attributePaths = {
                    "admin",
                    "targetUser",
                    "targetSession"
            }
    )
    List<ModerationAction>
    findByReport_IdOrderByCreatedAtAsc(
            UUID reportId
    );

    @EntityGraph(
            attributePaths = {
                    "admin",
                    "targetUser",
                    "targetSession"
            }
    )
    List<ModerationAction>
    findByReport_IdInOrderByCreatedAtAsc(
            Collection<UUID> reportIds
    );
}