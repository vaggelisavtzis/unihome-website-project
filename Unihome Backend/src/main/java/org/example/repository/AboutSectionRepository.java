package org.example.repository;

import org.example.model.content.AboutSectionEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutSectionRepository extends JpaRepository<AboutSectionEntity, UUID> {
    Optional<AboutSectionEntity> findBySlug(String slug);
    List<AboutSectionEntity> findAllByPublishedIsTrueOrderByOrderIndexAsc();
}
