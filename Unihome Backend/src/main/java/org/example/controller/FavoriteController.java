package org.example.controller;

import org.example.dto.favorite.FavoriteResponse;
import org.example.dto.favorite.ToggleFavoriteRequest;
import org.example.dto.favorite.ToggleFavoriteResponse;
import org.example.model.favorite.FavoriteType;
import org.example.security.SecurityUtils;
import org.example.service.FavoriteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteResponse> listFavorites(@RequestParam(name = "type", required = false) FavoriteType type) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return favoriteService.listFavorites(userId, type);
    }

    @PostMapping("/toggle")
    @ResponseStatus(HttpStatus.OK)
    public ToggleFavoriteResponse toggleFavorite(@Valid @RequestBody ToggleFavoriteRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        return favoriteService.toggleFavorite(userId, request);
    }
}
