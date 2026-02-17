package org.example.dto.roommate;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.model.roommate.RoommateAdMode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class UpdateRoommateAdRequest {

    private String title;
    private String description;
    private BigDecimal monthlyRent;
    private String propertyLocation;
    private RoommateAdMode mode;
    private LocalDate availableFrom;
    private List<String> preferences = new ArrayList<>();
    private List<String> propertyFeatures = new ArrayList<>();
    private List<String> lifestyle = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private List<String> amenities = new ArrayList<>();
    private RoommateProfileDto profile;
    private RoommateLocationDto location;
    private RoommateContactDto contact;
    private AvailabilityScheduleDto availability;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getMonthlyRent() {
        return monthlyRent;
    }

    public void setMonthlyRent(BigDecimal monthlyRent) {
        this.monthlyRent = monthlyRent;
    }

    public String getPropertyLocation() {
        return propertyLocation;
    }

    public void setPropertyLocation(String propertyLocation) {
        this.propertyLocation = propertyLocation;
    }

    public RoommateAdMode getMode() {
        return mode;
    }

    public void setMode(RoommateAdMode mode) {
        this.mode = mode;
    }

    public LocalDate getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalDate availableFrom) {
        this.availableFrom = availableFrom;
    }

    public List<String> getPreferences() {
        return preferences;
    }

    public void setPreferences(List<String> preferences) {
        this.preferences = preferences;
    }

    public List<String> getPropertyFeatures() {
        return propertyFeatures;
    }

    public void setPropertyFeatures(List<String> propertyFeatures) {
        this.propertyFeatures = propertyFeatures;
    }

    public List<String> getLifestyle() {
        return lifestyle;
    }

    public void setLifestyle(List<String> lifestyle) {
        this.lifestyle = lifestyle;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities;
    }

    public RoommateProfileDto getProfile() {
        return profile;
    }

    public void setProfile(RoommateProfileDto profile) {
        this.profile = profile;
    }

    public RoommateLocationDto getLocation() {
        return location;
    }

    public void setLocation(RoommateLocationDto location) {
        this.location = location;
    }

    public RoommateContactDto getContact() {
        return contact;
    }

    public void setContact(RoommateContactDto contact) {
        this.contact = contact;
    }

    public AvailabilityScheduleDto getAvailability() {
        return availability;
    }

    public void setAvailability(AvailabilityScheduleDto availability) {
        this.availability = availability;
    }
}
