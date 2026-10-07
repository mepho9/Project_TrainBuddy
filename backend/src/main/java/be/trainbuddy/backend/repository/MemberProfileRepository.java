package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MemberProfileRepository
        extends JpaRepository<MemberProfile, UUID> {

    Optional<MemberProfile> findByUserId(
            UUID userId
    );

    void deleteByUserId(
            UUID userId
    );
}