package org.example.mapper;

import org.example.dto.property.CreatePropertyRequest;
import org.example.dto.property.PropertyBasicsDto;
import org.example.dto.property.PropertyContactDto;
import org.example.dto.property.PropertyLocationDto;
import org.example.dto.property.PropertyResponse;
import org.example.dto.property.UpdatePropertyRequest;
import org.example.model.property.PropertyBasicsEmbeddable;
import org.example.model.property.PropertyContactEmbeddable;
import org.example.model.property.PropertyEntity;
import org.example.model.property.PropertyLocationEmbeddable;
import org.example.model.user.UserEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PropertyMapper {

    private final AvailabilityMapper availabilityMapper;

    public PropertyMapper(AvailabilityMapper availabilityMapper) {
        this.availabilityMapper = availabilityMapper;
    }

    public PropertyEntity toEntity(CreatePropertyRequest request, UserEntity owner) {
        PropertyEntity entity = new PropertyEntity();
        entity.setOwner(owner);
        apply(entity, request);
        return entity;
    }

    public void apply(PropertyEntity entity, UpdatePropertyRequest request) {
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setPrice(request.getPrice());
        entity.setArea(request.getArea());
        entity.setRooms(request.getRooms());
        entity.setFeatures(normalize(request.getFeatures()));
        entity.setImages(normalize(request.getImages()));
        entity.setBasics(toBasics(request.getBasics()));
        entity.setLocation(toLocation(request.getLocation()));
        entity.setContact(toContact(request.getContact()));
        entity.setAvailability(availabilityMapper.toEmbeddable(request.getAvailability()));
        if (request.getHospitality() != null) {
            entity.setHospitalityOptIn(request.getHospitality());
        }
    }

    public void apply(PropertyEntity entity, CreatePropertyRequest request) {
        UpdatePropertyRequest updateRequest = new UpdatePropertyRequest();
        updateRequest.setTitle(request.getTitle());
        updateRequest.setDescription(request.getDescription());
        updateRequest.setType(request.getType());
        updateRequest.setPrice(request.getPrice());
        updateRequest.setArea(request.getArea());
        updateRequest.setRooms(request.getRooms());
        updateRequest.setFeatures(Optional.ofNullable(request.getFeatures()).orElseGet(ArrayList::new));
        updateRequest.setImages(Optional.ofNullable(request.getImages()).orElseGet(ArrayList::new));
        updateRequest.setBasics(request.getBasics());
        updateRequest.setLocation(request.getLocation());
        updateRequest.setContact(request.getContact());
        updateRequest.setAvailability(request.getAvailability());
        updateRequest.setHospitality(request.isHospitality());
        apply(entity, updateRequest);
    }

    public PropertyResponse toResponse(PropertyEntity entity) {
        if (entity == null) {
            return null;
        }
        PropertyResponse dto = new PropertyResponse();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setType(entity.getType());
        dto.setPrice(entity.getPrice());
        dto.setArea(entity.getArea());
        dto.setRooms(entity.getRooms());
        dto.setFeatures(normalize(entity.getFeatures()));
        dto.setImages(normalize(entity.getImages()));
        dto.setBasics(toBasicsDto(entity.getBasics()));
        dto.setLocation(toLocationDto(entity.getLocation()));
        dto.setContact(toContactDto(entity.getContact()));
        dto.setAvailability(availabilityMapper.toDto(entity.getAvailability()));
        if (entity.getOwner() != null) {
            dto.setOwnerId(entity.getOwner().getId());
            dto.setOwnerName(formatOwnerName(entity.getOwner()));
        }
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setHospitality(entity.isHospitalityOptIn());
        dto.setHospitalityListingId(entity.getHospitalityListingId());
        dto.setPublished(entity.isPublished());
        return dto;
    }

    private PropertyBasicsEmbeddable toBasics(PropertyBasicsDto dto) {
        if (dto == null) {
            return null;
        }
        PropertyBasicsEmbeddable embeddable = new PropertyBasicsEmbeddable();
        embeddable.setFurnished(dto.getFurnished());
        embeddable.setHasDamage(dto.getHasDamage());
        return embeddable;
    }

    private PropertyBasicsDto toBasicsDto(PropertyBasicsEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        PropertyBasicsDto dto = new PropertyBasicsDto();
        dto.setFurnished(embeddable.getFurnished());
        dto.setHasDamage(embeddable.getHasDamage());
        return dto;
    }

    private PropertyLocationEmbeddable toLocation(PropertyLocationDto dto) {
        if (dto == null) {
            return null;
        }
        PropertyLocationEmbeddable embeddable = new PropertyLocationEmbeddable();
        embeddable.setAddress(dto.getAddress());
        embeddable.setCity(dto.getCity());
        embeddable.setPostalCode(dto.getPostalCode());
        embeddable.setLatitude(dto.getLat());
        embeddable.setLongitude(dto.getLng());
        return embeddable;
    }

    private PropertyLocationDto toLocationDto(PropertyLocationEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        PropertyLocationDto dto = new PropertyLocationDto();
        dto.setAddress(embeddable.getAddress());
        dto.setCity(embeddable.getCity());
        dto.setPostalCode(embeddable.getPostalCode());
        dto.setLat(embeddable.getLatitude());
        dto.setLng(embeddable.getLongitude());
        return dto;
    }

    private PropertyContactEmbeddable toContact(PropertyContactDto dto) {
        if (dto == null) {
            return null;
        }
        PropertyContactEmbeddable embeddable = new PropertyContactEmbeddable();
        embeddable.setName(dto.getName());
        embeddable.setPhone(dto.getPhone());
        embeddable.setEmail(dto.getEmail());
        embeddable.setInstagram(dto.getInstagram());
        embeddable.setFacebook(dto.getFacebook());
        return embeddable;
    }

    private PropertyContactDto toContactDto(PropertyContactEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        PropertyContactDto dto = new PropertyContactDto();
        dto.setName(embeddable.getName());
        dto.setPhone(embeddable.getPhone());
        dto.setEmail(embeddable.getEmail());
        dto.setInstagram(embeddable.getInstagram());
        dto.setFacebook(embeddable.getFacebook());
        return dto;
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().collect(java.util.stream.Collectors.toList());
    }

    private String formatOwnerName(UserEntity owner) {
        String first = owner.getFirstName() != null ? owner.getFirstName().trim() : "";
        String last = owner.getLastName() != null ? owner.getLastName().trim() : "";
        return (first + " " + last).trim();
    }
}
