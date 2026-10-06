package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.ReportRequest;
import be.trainbuddy.backend.dto.ReportResponse;
import be.trainbuddy.backend.entity.Report;
import be.trainbuddy.backend.entity.SessionParticipant;
import be.trainbuddy.backend.entity.TrainingSession;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ForbiddenException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.ReportRepository;
import be.trainbuddy.backend.repository.SessionParticipantRepository;
import be.trainbuddy.backend.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final List<String>
            ACTIVE_REPORT_STATUSES =
            List.of(
                    "OPEN",
                    "REVIEWED"
            );

    private final ReportRepository
            reportRepository;

    private final TrainingSessionRepository
            trainingSessionRepository;

    private final SessionParticipantRepository
            participantRepository;

    /*
     * =========================
     * SIGNALER UNE SESSION
     * =========================
     */

    @Transactional
    public ReportResponse reportSession(

            UUID sessionId,

            ReportRequest request,

            User reporter

    ) {

        TrainingSession session =
                trainingSessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Session introuvable"
                                )
                        );

        /*
         * Signaler sa propre session n'a pas
         * de sens : le créateur peut simplement
         * l'annuler.
         */
        boolean creator =
                participantRepository
                        .existsBySessionIdAndUserIdAndCreatorTrueAndLeftAtIsNull(
                                sessionId,
                                reporter.getId()
                        );

        if (creator) {

            throw new BadRequestException(
                    "Vous ne pouvez pas signaler votre propre session"
            );
        }

        if (
                "CANCELLED".equalsIgnoreCase(
                        session.getStatus()
                )
        ) {

            throw new BadRequestException(
                    "Cette session est déjà annulée"
            );
        }

        long existingReports =
                reportRepository
                        .countActiveSessionReports(

                                reporter.getId(),

                                sessionId,

                                ACTIVE_REPORT_STATUSES
                        );

        if (existingReports > 0) {

            throw new ConflictException(
                    "Vous avez déjà un signalement en cours pour cette session"
            );
        }

        Report report =
                Report.builder()

                        .reporter(
                                reporter
                        )

                        .reportedUser(
                                null
                        )

                        .reportedSession(
                                session
                        )

                        .reason(
                                request
                                        .reason()
                                        .trim()
                        )

                        .details(
                                cleanDetails(
                                        request.details()
                                )
                        )

                        .status(
                                "OPEN"
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .reviewedAt(
                                null
                        )

                        .reviewedBy(
                                null
                        )

                        .build();

        return toResponse(
                reportRepository.save(
                        report
                )
        );
    }

    /*
     * =========================
     * SIGNALER UN PARTICIPANT
     * =========================
     */

    @Transactional
    public ReportResponse reportParticipant(

            UUID participantId,

            ReportRequest request,

            User reporter

    ) {

        SessionParticipant
                reportedParticipant =
                participantRepository
                        .findById(
                                participantId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Participant introuvable"
                                )
                        );

        if (
                reportedParticipant
                        .getLeftAt() != null
        ) {

            throw new BadRequestException(
                    "Ce participant n'est plus actif dans cette session"
            );
        }

        TrainingSession session =
                reportedParticipant
                        .getSession();

        /*
         * Pour pouvoir signaler un autre
         * participant, le membre doit lui-même
         * appartenir à cette session.
         */
        boolean reporterParticipates =
                participantRepository
                        .existsBySessionIdAndUserIdAndLeftAtIsNull(

                                session.getId(),

                                reporter.getId()
                        );

        if (!reporterParticipates) {

            throw new ForbiddenException(
                    "Vous devez participer à cette session pour signaler un participant"
            );
        }

        User reportedUser =
                reportedParticipant
                        .getUser();

        if (
                reportedUser
                        .getId()
                        .equals(
                                reporter.getId()
                        )
        ) {

            throw new BadRequestException(
                    "Vous ne pouvez pas vous signaler vous-même"
            );
        }

        long existingReports =
                reportRepository
                        .countActiveUserReports(

                                reporter.getId(),

                                reportedUser.getId(),

                                session.getId(),

                                ACTIVE_REPORT_STATUSES
                        );

        if (existingReports > 0) {

            throw new ConflictException(
                    "Vous avez déjà un signalement en cours concernant ce participant"
            );
        }

        /*
         * Pour un signalement de participant :
         *
         * reportedUser = véritable compte ciblé
         * reportedSession = contexte de la plainte
         *
         * Le frontend membre ne recevra jamais
         * l'adresse e-mail de reportedUser.
         */
        Report report =
                Report.builder()

                        .reporter(
                                reporter
                        )

                        .reportedUser(
                                reportedUser
                        )

                        .reportedSession(
                                session
                        )

                        .reason(
                                request
                                        .reason()
                                        .trim()
                        )

                        .details(
                                cleanDetails(
                                        request.details()
                                )
                        )

                        .status(
                                "OPEN"
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .reviewedAt(
                                null
                        )

                        .reviewedBy(
                                null
                        )

                        .build();

        return toResponse(
                reportRepository.save(
                        report
                )
        );
    }

    private ReportResponse toResponse(
            Report report
    ) {

        return new ReportResponse(

                report.getId(),

                report.getReportedUser() != null
                        ? "USER"
                        : "SESSION",

                report.getReason(),

                report.getDetails(),

                report.getStatus(),

                report.getCreatedAt()
        );
    }

    private String cleanDetails(
            String details
    ) {

        if (
                details == null
                        || details.isBlank()
        ) {
            return null;
        }

        return details.trim();
    }
}