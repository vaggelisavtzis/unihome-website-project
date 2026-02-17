package org.example.service;

import org.example.dto.favorite.FavoriteResponse;
import org.example.dto.favorite.ToggleFavoriteRequest;
import org.example.dto.favorite.ToggleFavoriteResponse;
import org.example.mapper.FavoriteMapper;
import org.example.model.favorite.FavoriteEntity;
import org.example.model.favorite.FavoriteType;
import org.example.model.user.UserEntity;
import org.example.repository.FavoriteRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final FavoriteMapper favoriteMapper;
    private final UserService userService;

    public FavoriteService(FavoriteRepository favoriteRepository, FavoriteMapper favoriteMapper, UserService userService) {
        this.favoriteRepository = favoriteRepository;
        this.favoriteMapper = favoriteMapper;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> listFavorites(UUID userId, FavoriteType type) {
        List<FavoriteEntity> favorites;
        if (type != null) {
            favorites = favoriteRepository.findByUserIdAndType(userId, type);
        } else {
            favorites = favoriteRepository.findByUserId(userId);
        }
        return favorites.stream()
            .map(favoriteMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public ToggleFavoriteResponse toggleFavorite(UUID userId, ToggleFavoriteRequest request) {
        FavoriteType type = request.getType();
        UUID targetId = request.getTargetId();
        Optional<FavoriteEntity> existing = favoriteRepository.findByUserIdAndTypeAndTargetId(userId, type, targetId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            ToggleFavoriteResponse response = new ToggleFavoriteResponse();
            response.setFavorite(false);
            response.setFavoriteEntry(null);
            return response;
        }

        UserEntity user = userService.findUser(userId);
        FavoriteEntity entity = new FavoriteEntity();
        entity.setUser(user);
        entity.setType(type);
        entity.setTargetId(targetId);
        FavoriteEntity saved = favoriteRepository.save(entity);

        ToggleFavoriteResponse response = new ToggleFavoriteResponse();
        response.setFavorite(true);
        response.setFavoriteEntry(favoriteMapper.toResponse(saved));
        return response;
    }
}
