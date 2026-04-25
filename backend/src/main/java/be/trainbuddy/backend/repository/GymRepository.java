package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.Gym;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GymRepository extends JpaRepository<Gym, UUID> {
}