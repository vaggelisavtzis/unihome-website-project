package org.example.repository;

import org.example.model.contact.ContactMessageEntity;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessageEntity, UUID> {
    Page<ContactMessageEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
