package org.example.dto.roommate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class RoommateSearchCriteria {

    private BigDecimal minRent;
    private BigDecimal maxRent;
    private String city;
    private LocalDate availableFrom;
    private Boolean studentOnly;
    private List<String> interests;
    private List<String> amenities;

    public BigDecimal getMinRent() {
        return minRent;
    }

    public void setMinRent(BigDecimal minRent) {
        this.minRent = minRent;
    }

    public BigDecimal getMaxRent() {
        return maxRent;
    }

    public void setMaxRent(BigDecimal maxRent) {
        this.maxRent = maxRent;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public LocalDate getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalDate availableFrom) {
        this.availableFrom = availableFrom;
    }

    public Boolean getStudentOnly() {
        return studentOnly;
    }

    public void setStudentOnly(Boolean studentOnly) {
        this.studentOnly = studentOnly;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities;
    }
}
