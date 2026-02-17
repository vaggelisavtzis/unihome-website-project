package org.example.dto.favorite;

import org.example.model.favorite.FavoriteType;
import org.example.model.user.UserRole;
import java.util.EnumSet;
import java.util.UUID;

public class FavoriteSearchCriteria {

    private UUID userId;
    private EnumSet<UserRole> userRoles;
    private EnumSet<FavoriteType> types;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public EnumSet<UserRole> getUserRoles() {
        return userRoles;
    }

    public void setUserRoles(EnumSet<UserRole> userRoles) {
        this.userRoles = userRoles;
    }

    public EnumSet<FavoriteType> getTypes() {
        return types;
    }

    public void setTypes(EnumSet<FavoriteType> types) {
        this.types = types;
    }
}
