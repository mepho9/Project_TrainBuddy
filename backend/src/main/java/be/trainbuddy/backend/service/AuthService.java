package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.AuthResponse;
import be.trainbuddy.backend.dto.LoginRequest;
import be.trainbuddy.backend.dto.RegisterRequest;
import be.trainbuddy.backend.entity.Role;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.repository.RoleRepository;
import be.trainbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Cette adresse email est déjà utilisée");
        }

        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name("MEMBER")
                                .build()
                ));

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(memberRole)
                .banned(false)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().getName(),
                jwtService.generateToken(savedUser)
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Identifiants invalides"));

        if (user.isBanned()) {
            throw new BadRequestException("Ce compte est banni");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Identifiants invalides");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().getName(),
                jwtService.generateToken(user)
        );
    }
}