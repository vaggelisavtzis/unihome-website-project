package org.example.model.property;

import org.example.model.availability.AvailabilityScheduleEmbeddable;
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
@Table(name = "properties")
public class PropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PropertyType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Double area;

    @Column(nullable = false)
    private Integer rooms;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_features", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "feature", length = 100)
    private List<String> features = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_images", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "image_url", length = 2000)
    private List<String> images = new ArrayList<>();

    @Embedded
    private PropertyBasicsEmbeddable basics;

    @Embedded
    private PropertyLocationEmbeddable location;

    @Embedded
    private PropertyContactEmbeddable contact;

    @Embedded
    private AvailabilityScheduleEmbeddable availability;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Column(name = "hospitality_opt_in", nullable = false)
    private boolean hospitalityOptIn = false;

    @Column(name = "hospitality_listing_id")
    private UUID hospitalityListingId;

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

    public PropertyType getType() {
        return type;
    }

    public void setType(PropertyType type) {
        this.type = type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Double getArea() {
        return area;
    }

    public void setArea(Double area) {
        this.area = area;
    }

    public Integer getRooms() {
        return rooms;
    }

    public void setRooms(Integer rooms) {
        this.rooms = rooms;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public PropertyBasicsEmbeddable getBasics() {
        return basics;
    }

    public void setBasics(PropertyBasicsEmbeddable basics) {
        this.basics = basics;
    }

    public PropertyLocationEmbeddable getLocation() {
        return location;
    }

    public void setLocation(PropertyLocationEmbeddable location) {
        this.location = location;
    }

    public PropertyContactEmbeddable getContact() {
        return contact;
    }

    public void setContact(PropertyContactEmbeddable contact) {
        this.contact = contact;
    }

    public AvailabilityScheduleEmbeddable getAvailability() {
        return availability;
    }

    public void setAvailability(AvailabilityScheduleEmbeddable availability) {
        this.availability = availability;
    }

    public UserEntity getOwner() {
        return owner;
    }

    public void setOwner(UserEntity owner) {
        this.owner = owner;
    }

    public boolean isHospitalityOptIn() {
        return hospitalityOptIn;
    }

    public void setHospitalityOptIn(boolean hospitalityOptIn) {
        this.hospitalityOptIn = hospitalityOptIn;
    }

    public UUID getHospitalityListingId() {
        return hospitalityListingId;
    }

    public void setHospitalityListingId(UUID hospitalityListingId) {
        this.hospitalityListingId = hospitalityListingId;
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
