package org.example.mapper;

import org.example.dto.favorite.FavoriteResponse;
import org.example.model.favorite.FavoriteEntity;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public FavoriteResponse toResponse(FavoriteEntity entity) {
        if (entity == null) {
            return null;
        }
        FavoriteResponse dto = new FavoriteResponse();
        dto.setId(entity.getId());
        dto.setType(entity.getType());
        dto.setTargetId(entity.getTargetId());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
