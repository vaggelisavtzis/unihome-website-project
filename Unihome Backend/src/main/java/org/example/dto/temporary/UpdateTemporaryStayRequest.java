package org.example.dto.temporary;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.model.temporary.TemporaryStayCostCategory;
import org.example.model.temporary.TemporaryStayPurpose;
import org.example.model.temporary.TemporaryStayType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class UpdateTemporaryStayRequest {

    private String title;
    private String description;
    private TemporaryStayType type;
    private BigDecimal pricePerNight;
    private Integer minNights;
    private TemporaryStayCostCategory costCategory;
    private TemporaryStayLocationDto location;
    private TemporaryStayContactDto contact;
    private AvailabilityScheduleDto availability;
    private List<String> amenities = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private TemporaryStayPurpose purpose;

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

    public TemporaryStayLocationDto getLocation() {
        return location;
    }

    public void setLocation(TemporaryStayLocationDto location) {
        this.location = location;
    }

    public TemporaryStayContactDto getContact() {
        return contact;
    }

    public void setContact(TemporaryStayContactDto contact) {
        this.contact = contact;
    }

    public AvailabilityScheduleDto getAvailability() {
        return availability;
    }

    public void setAvailability(AvailabilityScheduleDto availability) {
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

    public TemporaryStayPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(TemporaryStayPurpose purpose) {
        this.purpose = purpose;
    }
}
