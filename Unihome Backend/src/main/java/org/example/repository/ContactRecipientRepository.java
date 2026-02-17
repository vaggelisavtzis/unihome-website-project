package org.example.repository;

import java.util.Optional;
import java.util.UUID;
import org.example.model.contact.ContactRecipientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRecipientRepository extends JpaRepository<ContactRecipientEntity, UUID> {
    Optional<ContactRecipientEntity> findFirstByActiveTrueOrderByCreatedAtDesc();
}
