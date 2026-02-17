package org.example.repository;

import org.example.model.content.HomeHighlightEntity;
import org.example.model.content.HomeHighlightType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomeHighlightRepository extends JpaRepository<HomeHighlightEntity, UUID> {
    List<HomeHighlightEntity> findByPublishedIsTrueOrderByPriorityAsc();
    List<HomeHighlightEntity> findByTypeAndPublishedIsTrueOrderByPriorityAsc(HomeHighlightType type);
}
