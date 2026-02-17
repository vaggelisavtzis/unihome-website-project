package org.example.model.property;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class PropertyBasicsEmbeddable {

    @Column(name = "is_furnished")
    private Boolean furnished;

    @Column(name = "has_damage")
    private Boolean hasDamage;

    public Boolean getFurnished() {
        return furnished;
    }

    public void setFurnished(Boolean furnished) {
        this.furnished = furnished;
    }

    public Boolean getHasDamage() {
        return hasDamage;
    }

    public void setHasDamage(Boolean hasDamage) {
        this.hasDamage = hasDamage;
    }
}
