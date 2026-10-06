package be.trainbuddy.backend.service;

import be.trainbuddy.backend.dto.AdminReportResponse;
import be.trainbuddy.backend.dto.ModerationActionResponse;
import be.trainbuddy.backend.entity.ModerationAction;
import be.trainbuddy.backend.entity.Report;
import be.trainbuddy.backend.entity.User;
import be.trainbuddy.backend.exception.BadRequestException;
import be.trainbuddy.backend.exception.ConflictException;
import be.trainbuddy.backend.exception.ResourceNotFoundException;
import be.trainbuddy.backend.repository.ModerationActionRepository;
import be.trainbuddy.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository
            reportRepository;

    private final ModerationActionRepository
            actionRepository;

    /*
     * On réutilise les règles déjà écrites
     * au chapitre 4 pour le bannissement et
     * l'annulation administrative.
     */
    private final AdminService
            adminService;

    /*
     * =========================
     * LISTE DES SIGNALEMENTS
     * =========================
     */

    @Transactional(readOnly = true)
    public List<AdminReportResponse>
    getReports() {

        List<Report> reports =
                reportRepository
                        .findAllByOrderByCreatedAtDesc();

        if (reports.isEmpty()) {
            return List.of();
        }

        List<UUID> reportIds =
                reports.stream()
                        .map(
                                Report::getId
                        )
                        .toList();

        List<ModerationAction>
                actions =
                actionRepository
                        .findByReport_IdInOrderByCreatedAtAsc(
                                reportIds
                        );

        Map<UUID, List<ModerationAction>>
                actionsByReport =
                new HashMap<>();

        for (
                ModerationAction action :
                actions
        ) {

            actionsByReport
                    .computeIfAbsent(
                            action
                                    .getReport()
                                    .getId(),
                            ignored ->
                                    new ArrayList<>()
                    )
                    .add(action);
        }

        return reports.stream()
                .map(report ->
                        toAdminResponse(

                                report,

                                actionsByReport
                                        .getOrDefault(
                                                report.getId(),
                                                List.of()
                                        )
                        )
                )
                .toList();
    }

    /*
     * =========================
     * PRENDRE EN CHARGE
     * =========================
     */

    @Transactional
    public AdminReportResponse
    reviewReport(

            UUID reportId,

            User currentAdmin

    ) {

        Report report =
                getReport(
                        reportId
                );

        if (
                "CLOSED".equalsIgnoreCase(
                        report.getStatus()
                )
        ) {

            throw new ConflictException(
                    "Ce signalement est déjà fermé"
            );
        }

        if (
                "REVIEWED".equalsIgnoreCase(
                        report.getStatus()
                )
        ) {

            throw new ConflictException(
                    "Ce signalement est déjà pris en charge"
            );
        }

        report.setStatus(
                "REVIEWED"
        );

        report.setReviewedAt(
                LocalDateTime.now()
        );

        report.setReviewedBy(
                currentAdmin
        );

        reportRepository.save(
                report
        );

        recordAction(

                report,

                currentAdmin,

                "MARK_REVIEWED",

                "Signalement pris en charge par un administrateur"
        );

        return getReportResponse(
                reportId
        );
    }

    /*
     * =========================
     * IGNORER / FERMER
     * =========================
     */

    @Transactional
    public AdminReportResponse
    ignoreReport(

            UUID reportId,

            User currentAdmin

    ) {

        Report report =
                getReport(
                        reportId
                );

        ensureReviewed(
                report
        );

        report.setStatus(
                "CLOSED"
        );

        reportRepository.save(
                report
        );

        recordAction(

                report,

                currentAdmin,

                "IGNORE_REPORT",

                "Signalement fermé sans sanction"
        );

        return getReportResponse(
                reportId
        );
    }

    /*
     * =========================
     * RETIRER LA SESSION
     * =========================
     */

    @Transactional
    public AdminReportResponse
    cancelReportedSession(

            UUID reportId,

            User currentAdmin

    ) {

        Report report =
                getReport(
                        reportId
                );

        ensureReviewed(
                report
        );

        /*
         * Un signalement USER possède lui aussi
         * une session de contexte.
         *
         * On vérifie donc reportedUser == null
         * afin de savoir que la cible principale
         * est bien la session.
         */
        if (
                report.getReportedUser() != null
                        || report.getReportedSession() == null
        ) {

            throw new BadRequestException(
                    "Ce signalement ne concerne pas directement une session"
            );
        }

        adminService.cancelSession(
                report
                        .getReportedSession()
                        .getId()
        );

        report.setStatus(
                "CLOSED"
        );

        reportRepository.save(
                report
        );

        recordAction(

                report,

                currentAdmin,

                "CANCEL_SESSION",

                "Session retirée à la suite du signalement"
        );

        return getReportResponse(
                reportId
        );
    }

    /*
     * =========================
     * BANNIR LE MEMBRE
     * =========================
     */

    @Transactional
    public AdminReportResponse
    banReportedUser(

            UUID reportId,

            User currentAdmin

    ) {

        Report report =
                getReport(
                        reportId
                );

        ensureReviewed(
                report
        );

        if (
                report.getReportedUser()
                        == null
        ) {

            throw new BadRequestException(
                    "Ce signalement ne concerne pas un utilisateur"
            );
        }

        adminService.banUser(

                report
                        .getReportedUser()
                        .getId(),

                currentAdmin
        );

        report.setStatus(
                "CLOSED"
        );

        reportRepository.save(
                report
        );

        recordAction(

                report,

                currentAdmin,

                "BAN_USER",

                "Utilisateur banni à la suite du signalement"
        );

        return getReportResponse(
                reportId
        );
    }

    /*
     * =========================
     * OUTILS
     * =========================
     */

    private Report getReport(
            UUID reportId
    ) {

        return reportRepository
                .findDetailedById(
                        reportId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Signalement introuvable"
                        )
                );
    }

    private void ensureReviewed(
            Report report
    ) {

        if (
                "CLOSED".equalsIgnoreCase(
                        report.getStatus()
                )
        ) {

            throw new ConflictException(
                    "Ce signalement est déjà fermé"
            );
        }

        if (
                !"REVIEWED".equalsIgnoreCase(
                        report.getStatus()
                )
        ) {

            throw new BadRequestException(
                    "Le signalement doit d'abord être pris en charge"
            );
        }
    }

    private void recordAction(

            Report report,

            User currentAdmin,

            String actionType,

            String notes

    ) {

        ModerationAction action =
                ModerationAction.builder()

                        .report(
                                report
                        )

                        .admin(
                                currentAdmin
                        )

                        .actionType(
                                actionType
                        )

                        .targetUser(
                                report.getReportedUser()
                        )

                        .targetSession(
                                report.getReportedSession()
                        )

                        .notes(
                                notes
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .build();

        actionRepository.save(
                action
        );
    }

    private AdminReportResponse
    getReportResponse(
            UUID reportId
    ) {

        Report report =
                getReport(
                        reportId
                );

        List<ModerationAction>
                actions =
                actionRepository
                        .findByReport_IdOrderByCreatedAtAsc(
                                reportId
                        );

        return toAdminResponse(
                report,
                actions
        );
    }

    private AdminReportResponse
    toAdminResponse(

            Report report,

            List<ModerationAction>
                    actions

    ) {

        String targetType =
                report.getReportedUser()
                        != null
                        ? "USER"
                        : "SESSION";

        return new AdminReportResponse(

                report.getId(),

                report.getStatus(),

                report.getReason(),

                report.getDetails(),

                report.getCreatedAt(),

                report.getReviewedAt(),

                report
                        .getReporter()
                        .getEmail(),

                targetType,

                report.getReportedUser()
                        != null
                        ? report
                          .getReportedUser()
                          .getId()
                        : null,

                report.getReportedUser()
                        != null
                        ? report
                          .getReportedUser()
                          .getEmail()
                        : null,

                report.getReportedUser()
                        != null
                        ? report
                          .getReportedUser()
                          .isBanned()
                        : null,

                report.getReportedSession()
                        != null
                        ? report
                          .getReportedSession()
                          .getId()
                        : null,

                report.getReportedSession()
                        != null
                        ? report
                          .getReportedSession()
                          .getTitle()
                        : null,

                report.getReportedSession()
                        != null
                        ? report
                          .getReportedSession()
                          .getStatus()
                        : null,

                report.getReviewedBy()
                        != null
                        ? report
                          .getReviewedBy()
                          .getEmail()
                        : null,

                actions.stream()
                        .map(
                                this::toActionResponse
                        )
                        .toList()
        );
    }

    private ModerationActionResponse
    toActionResponse(
            ModerationAction action
    ) {

        return new ModerationActionResponse(

                action.getId(),

                action.getActionType(),

                action
                        .getAdmin()
                        .getEmail(),

                action.getNotes(),

                action.getCreatedAt()
        );
    }
}