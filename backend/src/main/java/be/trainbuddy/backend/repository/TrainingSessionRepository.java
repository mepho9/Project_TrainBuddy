package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.TrainingSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TrainingSessionRepository
        extends JpaRepository<TrainingSession, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select s
            from TrainingSession s
            where s.id = :id
            """)
    Optional<TrainingSession> findByIdForUpdate(
            @Param("id") UUID id
    );
}