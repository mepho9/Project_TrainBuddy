package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.TrainingSessionRequest;
import be.trainbuddy.backend.dto.TrainingSessionResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.GymRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingSessionService {

    private final TrainingSessionRepository trainingSessionRepository;
    private final GymRepository gymRepository;

    public List<TrainingSessionResponse> findAll() {
        return trainingSessionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TrainingSessionResponse findById(UUID id) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'entraînement introuvable"));

        return toResponse(session);
    }

    public TrainingSessionResponse create(TrainingSessionRequest request) {
        Gym gym = gymRepository.findById(request.gymId())
                .orElseThrow(() -> new ResourceNotFoundException("Salle de sport introuvable"));

        TrainingSession session = TrainingSession.builder()
                .gym(gym)
                .title(request.title())
                .activityType(request.activityType())
                .description(request.description())
                .startAt(request.startAt())
                .durationMin(request.durationMin())
                .capacity(request.capacity())
                .status("UPCOMING")
                .visibility(request.visibility())
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(trainingSessionRepository.save(session));
    }

    private TrainingSessionResponse toResponse(TrainingSession session) {
        return new TrainingSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getActivityType(),
                session.getDescription(),
                session.getStartAt(),
                session.getDurationMin(),
                session.getCapacity(),
                session.getStatus(),
                session.getVisibility(),
                session.getGym().getId(),
                session.getGym().getName()
        );
    }
}