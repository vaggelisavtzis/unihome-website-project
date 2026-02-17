package org.example.mapper;

import org.example.dto.temporary.CreateTemporaryStayRequest;
import org.example.dto.temporary.TemporaryStayContactDto;
import org.example.dto.temporary.TemporaryStayLocationDto;
import org.example.dto.temporary.TemporaryStayManagerDto;
import org.example.dto.temporary.TemporaryStayResponse;
import org.example.dto.temporary.UpdateTemporaryStayRequest;
import org.example.model.temporary.TemporaryStayContactEmbeddable;
import org.example.model.temporary.TemporaryStayEntity;
import org.example.model.temporary.TemporaryStayLocationEmbeddable;
import org.example.model.temporary.TemporaryStayPurpose;
import org.example.model.user.UserEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class TemporaryStayMapper {

    private final AvailabilityMapper availabilityMapper;

    public TemporaryStayMapper(AvailabilityMapper availabilityMapper) {
        this.availabilityMapper = availabilityMapper;
    }

    public TemporaryStayEntity toEntity(CreateTemporaryStayRequest request) {
        TemporaryStayEntity entity = new TemporaryStayEntity();
        apply(entity, request);
        return entity;
    }

    public void apply(TemporaryStayEntity entity, CreateTemporaryStayRequest request) {
        UpdateTemporaryStayRequest update = new UpdateTemporaryStayRequest();
        update.setTitle(request.getTitle());
        update.setDescription(request.getDescription());
        update.setType(request.getType());
        update.setPricePerNight(request.getPricePerNight());
        update.setMinNights(request.getMinNights());
        update.setCostCategory(request.getCostCategory());
        update.setLocation(request.getLocation());
        update.setContact(request.getContact());
        update.setAvailability(request.getAvailability());
        update.setAmenities(new ArrayList<>(request.getAmenities()));
        update.setImages(new ArrayList<>(request.getImages()));
        update.setPurpose(request.getPurpose());
        apply(entity, update);
        entity.setPurpose(request.getPurpose() != null ? request.getPurpose() : TemporaryStayPurpose.ACCOMMODATION);
        entity.setLinkedPropertyId(request.getLinkedPropertyId());
    }

    public void apply(TemporaryStayEntity entity, UpdateTemporaryStayRequest request) {
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setPricePerNight(request.getPricePerNight());
        entity.setMinNights(request.getMinNights());
        entity.setCostCategory(request.getCostCategory());
        entity.setLocation(toLocation(request.getLocation()));
        entity.setContact(toContact(request.getContact()));
        entity.setAvailability(availabilityMapper.toTemporaryEmbeddable(request.getAvailability()));
        entity.setAmenities(normalize(request.getAmenities()));
        entity.setImages(normalize(request.getImages()));
        if (request.getPurpose() != null) {
            entity.setPurpose(request.getPurpose());
        }
    }

    public TemporaryStayResponse toResponse(TemporaryStayEntity entity) {
        if (entity == null) {
            return null;
        }
        TemporaryStayResponse dto = new TemporaryStayResponse();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setType(entity.getType());
        dto.setPricePerNight(entity.getPricePerNight());
        dto.setMinNights(entity.getMinNights());
        dto.setCostCategory(entity.getCostCategory());
        dto.setLocation(toLocationDto(entity.getLocation()));
        dto.setContact(toContactDto(entity.getContact()));
        dto.setAvailability(availabilityMapper.toDto(entity.getAvailability()));
        dto.setAmenities(normalize(entity.getAmenities()));
        dto.setImages(normalize(entity.getImages()));
        dto.setManager(toManagerDto(entity.getManager()));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setPurpose(entity.getPurpose());
        dto.setLinkedPropertyId(entity.getLinkedPropertyId());
        dto.setPublished(entity.isPublished());
        return dto;
    }

    private TemporaryStayLocationEmbeddable toLocation(TemporaryStayLocationDto dto) {
        if (dto == null) {
            return null;
        }
        TemporaryStayLocationEmbeddable embeddable = new TemporaryStayLocationEmbeddable();
        embeddable.setAddress(dto.getAddress());
        embeddable.setCity(dto.getCity());
        embeddable.setPostalCode(dto.getPostalCode());
        embeddable.setLatitude(dto.getLat());
        embeddable.setLongitude(dto.getLng());
        return embeddable;
    }

    private TemporaryStayLocationDto toLocationDto(TemporaryStayLocationEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        TemporaryStayLocationDto dto = new TemporaryStayLocationDto();
        dto.setAddress(embeddable.getAddress());
        dto.setCity(embeddable.getCity());
        dto.setPostalCode(embeddable.getPostalCode());
        dto.setLat(embeddable.getLatitude());
        dto.setLng(embeddable.getLongitude());
        return dto;
    }

    private TemporaryStayContactEmbeddable toContact(TemporaryStayContactDto dto) {
        if (dto == null) {
            return null;
        }
        TemporaryStayContactEmbeddable embeddable = new TemporaryStayContactEmbeddable();
        embeddable.setName(dto.getName());
        embeddable.setPhone(dto.getPhone());
        embeddable.setEmail(dto.getEmail());
        embeddable.setWebsite(dto.getWebsite());
        embeddable.setInstagram(dto.getInstagram());
        embeddable.setFacebook(dto.getFacebook());
        return embeddable;
    }

    private TemporaryStayContactDto toContactDto(TemporaryStayContactEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        TemporaryStayContactDto dto = new TemporaryStayContactDto();
        dto.setName(embeddable.getName());
        dto.setPhone(embeddable.getPhone());
        dto.setEmail(embeddable.getEmail());
        dto.setWebsite(embeddable.getWebsite());
        dto.setInstagram(embeddable.getInstagram());
        dto.setFacebook(embeddable.getFacebook());
        return dto;
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .distinct()
            .collect(Collectors.toList());
    }

    private TemporaryStayManagerDto toManagerDto(UserEntity manager) {
        if (manager == null) {
            return null;
        }
        TemporaryStayManagerDto dto = new TemporaryStayManagerDto();
        dto.setId(manager.getId());
        dto.setFullName(resolveFullName(manager));
        dto.setEmail(manager.getEmail());
        dto.setPhone(manager.getPhone());
        dto.setRole(manager.getRole() != null ? manager.getRole().name() : null);
        return dto;
    }

    private String resolveFullName(UserEntity manager) {
        String first = manager.getFirstName() != null ? manager.getFirstName().trim() : "";
        String last = manager.getLastName() != null ? manager.getLastName().trim() : "";
        String combined = (first + " " + last).trim();
        return combined.isEmpty() ? manager.getEmail() : combined;
    }
}
