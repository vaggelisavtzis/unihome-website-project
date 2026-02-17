package org.example.repository;

import org.example.model.favorite.FavoriteEntity;
import org.example.model.favorite.FavoriteType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, UUID> {
    List<FavoriteEntity> findByUserId(UUID userId);
    List<FavoriteEntity> findByUserIdAndType(UUID userId, FavoriteType type);
    Optional<FavoriteEntity> findByUserIdAndTypeAndTargetId(UUID userId, FavoriteType type, UUID targetId);
}
