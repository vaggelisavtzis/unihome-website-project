package org.example.repository;

import org.example.model.roommate.RoommateRatingEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoommateRatingRepository extends JpaRepository<RoommateRatingEntity, UUID> {
    List<RoommateRatingEntity> findByAdId(UUID adId);
    long countByAdId(UUID adId);
}
