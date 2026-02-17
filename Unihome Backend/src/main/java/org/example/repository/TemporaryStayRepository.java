package org.example.repository;

import org.example.model.temporary.TemporaryStayEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TemporaryStayRepository extends JpaRepository<TemporaryStayEntity, UUID>, JpaSpecificationExecutor<TemporaryStayEntity> {
    List<TemporaryStayEntity> findTop6ByOrderByCreatedAtDesc();

    Page<TemporaryStayEntity> findByPublishedTrue(Pageable pageable);

    List<TemporaryStayEntity> findAllByManagerIdOrderByCreatedAtDesc(UUID managerId);
}
