package org.example.dto.roommate;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.model.roommate.RoommateAdMode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class RoommateAdResponse {

    private UUID id;
    private String title;
    private String description;
    private BigDecimal monthlyRent;
    private String propertyLocation;
    private RoommateAdMode mode;
    private LocalDate availableFrom;
    private Instant createdAt;
    private boolean published;
    private UUID authorId;
    private String authorName;
    private List<String> preferences = new ArrayList<>();
    private List<String> propertyFeatures = new ArrayList<>();
    private List<String> lifestyle = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private List<String> amenities = new ArrayList<>();
    private RoommateProfileDto profile;
    private RoommateLocationDto location;
    private RoommateContactDto contact;
    private AvailabilityScheduleDto availability;
    private List<RoommateRatingDto> ratings = new ArrayList<>();
    private long ratingCount;
    private Double averageRating;
    private Instant lastRatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public void setAuthorId(UUID authorId) {
        this.authorId = authorId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
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

    public List<RoommateRatingDto> getRatings() {
        return ratings;
    }

    public void setRatings(List<RoommateRatingDto> ratings) {
        this.ratings = ratings;
    }

    public long getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(long ratingCount) {
        this.ratingCount = ratingCount;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Instant getLastRatedAt() {
        return lastRatedAt;
    }

    public void setLastRatedAt(Instant lastRatedAt) {
        this.lastRatedAt = lastRatedAt;
    }
}
