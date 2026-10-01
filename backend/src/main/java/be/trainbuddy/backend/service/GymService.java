package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.GymRequest;
import be.trainbuddy.backend.dto.GymResponse;
import be.trainbuddy.backend.entity.Gym;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GymService {

    private final GymRepository gymRepository;

    /*
     * Partie publique :
     * uniquement les salles actives.
     */
    @Transactional(readOnly = true)
    public List<GymResponse> findAll() {

        return gymRepository
                .findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /*
     * Partie administration :
     * salles actives ET inactives.
     */
    @Transactional(readOnly = true)
    public List<GymResponse> findAllForAdmin() {

        return gymRepository
                .findAll()
                .stream()
                .sorted(
                        (a, b) ->
                                a.getName()
                                        .compareToIgnoreCase(
                                                b.getName()
                                        )
                )
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GymResponse findById(
            UUID id
    ) {

        Gym gym =
                findEntity(id);

        return toResponse(gym);
    }

    @Transactional
    public GymResponse create(
            GymRequest request
    ) {

        String name =
                request.name().trim();

        String address =
                request.address().trim();

        if (
                gymRepository
                        .existsByNameIgnoreCaseAndAddressIgnoreCase(
                                name,
                                address
                        )
        ) {
            throw new ConflictException(
                    "Une salle avec ce nom et cette adresse existe déjà"
            );
        }

        Gym gym =
                Gym.builder()
                        .name(name)
                        .type(
                                request.type().trim()
                        )
                        .address(address)
                        .latitude(
                                request.latitude()
                        )
                        .longitude(
                                request.longitude()
                        )
                        .active(true)
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .build();

        return toResponse(
                gymRepository.save(gym)
        );
    }

    @Transactional
    public GymResponse update(
            UUID id,
            GymRequest request
    ) {

        Gym gym =
                findEntity(id);

        String name =
                request.name().trim();

        String address =
                request.address().trim();

        if (
                gymRepository
                        .existsByNameIgnoreCaseAndAddressIgnoreCaseAndIdNot(
                                name,
                                address,
                                id
                        )
        ) {
            throw new ConflictException(
                    "Une autre salle avec ce nom et cette adresse existe déjà"
            );
        }

        gym.setName(name);

        gym.setType(
                request.type().trim()
        );

        gym.setAddress(address);

        gym.setLatitude(
                request.latitude()
        );

        gym.setLongitude(
                request.longitude()
        );

        return toResponse(
                gymRepository.save(gym)
        );
    }

    /*
     * On désactive une salle au lieu de
     * la supprimer physiquement.
     *
     * Les anciennes sessions peuvent ainsi
     * conserver correctement leur référence.
     */
    @Transactional
    public GymResponse setActive(
            UUID id,
            boolean active
    ) {

        Gym gym =
                findEntity(id);

        gym.setActive(active);

        return toResponse(
                gymRepository.save(gym)
        );
    }

    private Gym findEntity(
            UUID id
    ) {

        return gymRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Salle de sport introuvable"
                        )
                );
    }

    private GymResponse toResponse(
            Gym gym
    ) {

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