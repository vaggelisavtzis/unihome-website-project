package org.example.dto.temporary;

import org.example.model.temporary.TemporaryStayCostCategory;
import org.example.model.temporary.TemporaryStayPurpose;
import org.example.model.temporary.TemporaryStayType;
import java.math.BigDecimal;
import java.util.List;

public class TemporaryStaySearchCriteria {

    private List<TemporaryStayType> types;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String city;
    private TemporaryStayCostCategory costCategory;
    private List<String> amenities;
    private TemporaryStayPurpose purpose;

    public List<TemporaryStayType> getTypes() {
        return types;
    }

    public void setTypes(List<TemporaryStayType> types) {
        this.types = types;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public TemporaryStayCostCategory getCostCategory() {
        return costCategory;
    }

    public void setCostCategory(TemporaryStayCostCategory costCategory) {
        this.costCategory = costCategory;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities;
    }

    public TemporaryStayPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(TemporaryStayPurpose purpose) {
        this.purpose = purpose;
    }
}
