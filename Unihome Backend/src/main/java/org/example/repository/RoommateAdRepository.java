package org.example.repository;

import org.example.model.roommate.RoommateAdEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RoommateAdRepository extends JpaRepository<RoommateAdEntity, UUID>, JpaSpecificationExecutor<RoommateAdEntity> {
    Page<RoommateAdEntity> findByAuthorId(UUID authorId, Pageable pageable);
    List<RoommateAdEntity> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
    List<RoommateAdEntity> findTop6ByOrderByCreatedAtDesc();
    List<RoommateAdEntity> findTop6ByPublishedTrueOrderByCreatedAtDesc();
}
