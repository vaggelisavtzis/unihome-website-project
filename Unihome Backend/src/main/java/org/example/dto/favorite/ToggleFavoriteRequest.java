package org.example.dto.favorite;

import org.example.model.favorite.FavoriteType;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class ToggleFavoriteRequest {

    @NotNull
    private FavoriteType type;

    @NotNull
    private UUID targetId;

    public FavoriteType getType() {
        return type;
    }

    public void setType(FavoriteType type) {
        this.type = type;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }
}
