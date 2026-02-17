package org.example.dto.favorite;

public class ToggleFavoriteResponse {

    private boolean favorite;
    private FavoriteResponse favoriteEntry;

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }

    public FavoriteResponse getFavoriteEntry() {
        return favoriteEntry;
    }

    public void setFavoriteEntry(FavoriteResponse favoriteEntry) {
        this.favoriteEntry = favoriteEntry;
    }
}
