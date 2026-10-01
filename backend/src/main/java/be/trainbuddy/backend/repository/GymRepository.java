package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.Gym;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GymRepository
        extends JpaRepository<Gym, UUID> {

    List<Gym> findByActiveTrueOrderByNameAsc();

    boolean existsByNameIgnoreCaseAndAddressIgnoreCase(
            String name,
            String address
    );

    boolean existsByNameIgnoreCaseAndAddressIgnoreCaseAndIdNot(
            String name,
            String address,
            UUID id
    );
}