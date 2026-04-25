package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.GymRequest;
import be.trainbuddy.backend.dto.GymResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GymService {

    private final GymRepository gymRepository;

    public List<GymResponse> findAll() {
        return gymRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public GymResponse findById(UUID id) {
        Gym gym = gymRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle de sport introuvable"));

        return toResponse(gym);
    }

    public GymResponse create(GymRequest request) {
        Gym gym = Gym.builder()
                .name(request.name())
                .type(request.type())
                .address(request.address())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(gymRepository.save(gym));
    }

    private GymResponse toResponse(Gym gym) {
        return new GymResponse(
                gym.getId(),
                gym.getName(),
                gym.getType(),
                gym.getAddress(),
                gym.getLatitude(),
                gym.getLongitude(),
                gym.isActive()
        );
    }
}