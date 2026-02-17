package org.example.model.roommate;

import org.example.model.availability.RoommateAvailabilityScheduleEmbeddable;
import org.example.model.user.UserEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "roommate_ads")
public class RoommateAdEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "property_location")
    private String propertyLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "listing_mode", nullable = false, length = 40)
    private RoommateAdMode mode = RoommateAdMode.HOST_SEEKING_ROOMMATE;

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "roommate_preferences", joinColumns = @JoinColumn(name = "ad_id"))
    @Column(name = "preference")
    private List<String> preferences = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "roommate_property_features", joinColumns = @JoinColumn(name = "ad_id"))
    @Column(name = "feature")
    private List<String> propertyFeatures = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "roommate_lifestyle", joinColumns = @JoinColumn(name = "ad_id"))
    @OrderColumn(name = "lifestyle_order")
    @Column(name = "lifestyle_tag")
    private List<String> lifestyle = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "roommate_images", joinColumns = @JoinColumn(name = "ad_id"))
    @Column(name = "image_url", length = 2000)
    private List<String> images = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "roommate_amenities", joinColumns = @JoinColumn(name = "ad_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @Embedded
    private RoommateProfileEmbeddable profile;

    @Embedded
    private RoommateLocationEmbeddable location;

    @Embedded
    private RoommateContactEmbeddable contact;

    @Embedded
    private RoommateAvailabilityScheduleEmbeddable availability;

    @OneToMany(mappedBy = "ad", fetch = FetchType.LAZY)
    private List<RoommateRatingEntity> ratings = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

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

    public UserEntity getAuthor() {
        return author;
    }

    public void setAuthor(UserEntity author) {
        this.author = author;
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

    public RoommateProfileEmbeddable getProfile() {
        return profile;
    }

    public void setProfile(RoommateProfileEmbeddable profile) {
        this.profile = profile;
    }

    public RoommateLocationEmbeddable getLocation() {
        return location;
    }

    public void setLocation(RoommateLocationEmbeddable location) {
        this.location = location;
    }

    public RoommateContactEmbeddable getContact() {
        return contact;
    }

    public void setContact(RoommateContactEmbeddable contact) {
        this.contact = contact;
    }

    public RoommateAvailabilityScheduleEmbeddable getAvailability() {
        return availability;
    }

    public void setAvailability(RoommateAvailabilityScheduleEmbeddable availability) {
        this.availability = availability;
    }

    public List<RoommateRatingEntity> getRatings() {
        return ratings;
    }

    public void setRatings(List<RoommateRatingEntity> ratings) {
        this.ratings = ratings;
    }
}
