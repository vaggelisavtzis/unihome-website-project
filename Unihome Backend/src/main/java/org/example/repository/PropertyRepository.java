package org.example.repository;

import org.example.model.property.PropertyEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PropertyRepository extends JpaRepository<PropertyEntity, UUID>, JpaSpecificationExecutor<PropertyEntity> {
    List<PropertyEntity> findTop6ByOrderByCreatedAtDesc();

    Page<PropertyEntity> findByPublishedTrue(Pageable pageable);

    List<PropertyEntity> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
