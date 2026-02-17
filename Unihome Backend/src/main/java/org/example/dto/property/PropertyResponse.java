package org.example.dto.property;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.model.property.PropertyType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PropertyResponse {

    private UUID id;
    private String title;
    private String description;
    private PropertyType type;
    private BigDecimal price;
    private Double area;
    private Integer rooms;
    private List<String> features = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private PropertyBasicsDto basics;
    private PropertyLocationDto location;
    private PropertyContactDto contact;
    private AvailabilityScheduleDto availability;
    private UUID ownerId;
    private String ownerName;
    private Instant createdAt;
    private boolean hospitality;
    private UUID hospitalityListingId;
    private boolean published;

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

    public PropertyBasicsDto getBasics() {
        return basics;
    }

    public void setBasics(PropertyBasicsDto basics) {
        this.basics = basics;
    }

    public PropertyLocationDto getLocation() {
        return location;
    }

    public void setLocation(PropertyLocationDto location) {
        this.location = location;
    }

    public PropertyContactDto getContact() {
        return contact;
    }

    public void setContact(PropertyContactDto contact) {
        this.contact = contact;
    }

    public AvailabilityScheduleDto getAvailability() {
        return availability;
    }

    public void setAvailability(AvailabilityScheduleDto availability) {
        this.availability = availability;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isHospitality() {
        return hospitality;
    }

    public void setHospitality(boolean hospitality) {
        this.hospitality = hospitality;
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
}
