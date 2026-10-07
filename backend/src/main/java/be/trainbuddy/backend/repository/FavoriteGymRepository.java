package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.FavoriteGym;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavoriteGymRepository
        extends JpaRepository<FavoriteGym, UUID> {

    @EntityGraph(attributePaths = "gym")
    List<FavoriteGym> findByUserIdOrderByGymNameAsc(
            UUID userId
    );

    boolean existsByUserIdAndGymId(
            UUID userId,
            UUID gymId
    );

    void deleteByUserIdAndGymId(
            UUID userId,
            UUID gymId
    );

    void deleteByUserId(
            UUID userId
    );
}