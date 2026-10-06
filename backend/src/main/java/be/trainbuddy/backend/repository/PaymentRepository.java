package be.trainbuddy.backend.repository;

import be.trainbuddy.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository
        extends JpaRepository<Payment, UUID> {

    boolean existsByExternalPaymentId(
            String externalPaymentId
    );
}