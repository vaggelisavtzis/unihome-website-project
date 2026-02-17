package org.example.model.roommate;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class RoommateLocationEmbeddable {

    @Column(name = "location_city")
    private String city;

    @Column(name = "location_area")
    private String area;

    @Column(name = "location_proximity")
    private String proximity;

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getProximity() {
        return proximity;
    }

    public void setProximity(String proximity) {
        this.proximity = proximity;
    }
}
