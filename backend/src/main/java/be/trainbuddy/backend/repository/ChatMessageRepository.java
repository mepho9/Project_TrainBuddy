package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.ChatMessage;
import be.trainbuddy.backend.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findBySessionAndDeletedFalseOrderBySentAtAsc(TrainingSession session);
}