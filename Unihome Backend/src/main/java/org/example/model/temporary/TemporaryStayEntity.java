package org.example.model.temporary;

import org.example.model.availability.TemporaryAvailabilityScheduleEmbeddable;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "temporary_stays")
public class TemporaryStayEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TemporaryStayType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerNight;

    @Column(nullable = false)
    private Integer minNights;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TemporaryStayCostCategory costCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 30)
    private TemporaryStayPurpose purpose = TemporaryStayPurpose.ACCOMMODATION;

    @Embedded
    private TemporaryStayLocationEmbeddable location;

    @Embedded
    private TemporaryStayContactEmbeddable contact;

    @Embedded
    private TemporaryAvailabilityScheduleEmbeddable availability;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "temporary_stay_amenities", joinColumns = @JoinColumn(name = "stay_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "temporary_stay_images", joinColumns = @JoinColumn(name = "stay_id"))
    @Column(name = "image_url", length = 2000)
    private List<String> images = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private UserEntity manager;

    @Column(name = "linked_property_id")
    private UUID linkedPropertyId;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

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

    public TemporaryStayType getType() {
        return type;
    }

    public void setType(TemporaryStayType type) {
        this.type = type;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public Integer getMinNights() {
        return minNights;
    }

    public void setMinNights(Integer minNights) {
        this.minNights = minNights;
    }

    public TemporaryStayCostCategory getCostCategory() {
        return costCategory;
    }

    public void setCostCategory(TemporaryStayCostCategory costCategory) {
        this.costCategory = costCategory;
    }

    public TemporaryStayPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(TemporaryStayPurpose purpose) {
        this.purpose = purpose;
    }

    public TemporaryStayLocationEmbeddable getLocation() {
        return location;
    }

    public void setLocation(TemporaryStayLocationEmbeddable location) {
        this.location = location;
    }

    public TemporaryStayContactEmbeddable getContact() {
        return contact;
    }

    public void setContact(TemporaryStayContactEmbeddable contact) {
        this.contact = contact;
    }

    public TemporaryAvailabilityScheduleEmbeddable getAvailability() {
        return availability;
    }

    public void setAvailability(TemporaryAvailabilityScheduleEmbeddable availability) {
        this.availability = availability;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public UserEntity getManager() {
        return manager;
    }

    public void setManager(UserEntity manager) {
        this.manager = manager;
    }

    public UUID getLinkedPropertyId() {
        return linkedPropertyId;
    }

    public void setLinkedPropertyId(UUID linkedPropertyId) {
        this.linkedPropertyId = linkedPropertyId;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
