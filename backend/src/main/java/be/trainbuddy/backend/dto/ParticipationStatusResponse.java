package be.trainbuddy.backend.dto;

public record ParticipationStatusResponse(

        boolean participating,

        ParticipantResponse participant

) {
}