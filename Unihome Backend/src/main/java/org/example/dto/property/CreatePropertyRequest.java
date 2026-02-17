package org.example.dto.property;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.model.property.PropertyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CreatePropertyRequest {

    @NotBlank
    private String title;

    @NotBlank
    @Size(max = 4000)
    private String description;

    @NotNull
    private PropertyType type;

    @NotNull
    private BigDecimal price;

    @NotNull
    private Double area;

    @NotNull
    private Integer rooms;

    private List<String> features = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private PropertyBasicsDto basics;
    private PropertyLocationDto location;
    private PropertyContactDto contact;
    private AvailabilityScheduleDto availability;
    private boolean hospitality;

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

    public boolean isHospitality() {
        return hospitality;
    }

    public void setHospitality(boolean hospitality) {
        this.hospitality = hospitality;
    }
}
