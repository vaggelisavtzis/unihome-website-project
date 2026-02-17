package org.example.service;

import org.example.dto.common.PagedResponse;
import org.example.dto.property.CreatePropertyRequest;
import org.example.dto.property.PropertyResponse;
import org.example.dto.property.PropertySearchCriteria;
import org.example.dto.property.UpdatePropertyRequest;
import org.example.dto.temporary.CreateTemporaryStayRequest;
import org.example.dto.temporary.TemporaryStayContactDto;
import org.example.dto.temporary.TemporaryStayLocationDto;
import org.example.dto.temporary.UpdateTemporaryStayRequest;
import org.example.exception.ForbiddenException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.PropertyMapper;
import org.example.model.property.PropertyEntity;
import org.example.model.user.UserEntity;
import org.example.model.user.UserRole;
import org.example.model.temporary.TemporaryStayCostCategory;
import org.example.model.temporary.TemporaryStayPurpose;
import org.example.model.temporary.TemporaryStayType;
import org.example.repository.PropertyRepository;
import org.example.repository.specification.PropertySpecifications;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;
    private final UserService userService;
    private final TemporaryStayService temporaryStayService;

    public PropertyService(PropertyRepository propertyRepository, PropertyMapper propertyMapper, UserService userService, TemporaryStayService temporaryStayService) {
        this.propertyRepository = propertyRepository;
        this.propertyMapper = propertyMapper;
        this.userService = userService;
        this.temporaryStayService = temporaryStayService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<PropertyResponse> search(PropertySearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Specification<PropertyEntity> specification = PropertySpecifications.fromCriteria(criteria);
        Page<PropertyEntity> result = propertyRepository.findAll(specification, pageable);
        List<PropertyResponse> items = result.stream()
            .map(propertyMapper::toResponse)
            .collect(Collectors.toList());
        return new PagedResponse<>(items, result.getTotalElements(), result.getTotalPages(), result.getNumber(), result.getSize());
    }

    @Transactional
    public PropertyResponse create(UUID ownerId, CreatePropertyRequest request) {
        UserEntity owner = requireOwner(ownerId);
        PropertyEntity entity = propertyMapper.toEntity(request, owner);
        entity.setPublished(true);
        PropertyEntity saved = propertyRepository.save(entity);
        synchronizeHospitalityListing(ownerId, saved, request.isHospitality());
        return propertyMapper.toResponse(saved);
    }

    @Transactional
    public PropertyResponse update(UUID ownerId, UUID propertyId, UpdatePropertyRequest request) {
        PropertyEntity property = requireProperty(propertyId);
        ensureOwnership(ownerId, property);
        boolean requestedHospitality = request.getHospitality() != null ? request.getHospitality() : property.isHospitalityOptIn();
        propertyMapper.apply(property, request);
        if (request.getHospitality() != null) {
            synchronizeHospitalityListing(ownerId, property, requestedHospitality);
        } else if (property.isHospitalityOptIn() && property.getHospitalityListingId() != null) {
            synchronizeHospitalityListing(ownerId, property, true);
        }
        return propertyMapper.toResponse(property);
    }

    @Transactional
    public void delete(UUID ownerId, UUID propertyId) {
        PropertyEntity property = requireProperty(propertyId);
        ensureOwnership(ownerId, property);
        propertyRepository.delete(property);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getById(UUID propertyId, UUID viewerId) {
        PropertyEntity property = requireProperty(propertyId);
        if (!property.isPublished()) {
            UUID ownerId = property.getOwner() != null ? property.getOwner().getId() : null;
            if (viewerId == null || ownerId == null || !ownerId.equals(viewerId)) {
                throw new ResourceNotFoundException("Property not found");
            }
        }
        return propertyMapper.toResponse(property);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> findRecent(int limit) {
        if (limit <= 0) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PropertyEntity> page = propertyRepository.findByPublishedTrue(pageable);
        return page.stream().map(propertyMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> findOwnerProperties(UUID ownerId) {
        requireOwner(ownerId);
        return propertyRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
            .map(propertyMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public PropertyResponse hide(UUID ownerId, UUID propertyId) {
        PropertyEntity property = requireProperty(propertyId);
        ensureOwnership(ownerId, property);
        property.setPublished(false);
        return propertyMapper.toResponse(property);
    }

    @Transactional
    public PropertyResponse publish(UUID ownerId, UUID propertyId) {
        PropertyEntity property = requireProperty(propertyId);
        ensureOwnership(ownerId, property);
        property.setPublished(true);
        return propertyMapper.toResponse(property);
    }

    private PropertyEntity requireProperty(UUID id) {
        return propertyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
    }

    private UserEntity requireOwner(UUID ownerId) {
        UserEntity user = userService.findUser(ownerId);
        if (user.getRole() != UserRole.OWNER) {
            throw new ForbiddenException("Only owners can manage properties");
        }
        return user;
    }

    private void ensureOwnership(UUID ownerId, PropertyEntity property) {
        if (property.getOwner() == null || !property.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("You do not own this property");
        }
    }

    private void synchronizeHospitalityListing(UUID ownerId, PropertyEntity property, boolean optIn) {
        if (!optIn) {
            UUID existing = property.getHospitalityListingId();
            if (existing != null) {
                try {
                    temporaryStayService.delete(ownerId, existing);
                } catch (ResourceNotFoundException ignored) {
                    
                }
                property.setHospitalityListingId(null);
            }
            property.setHospitalityOptIn(false);
            return;
        }

        if (property.getHospitalityListingId() == null) {
            UUID created = temporaryStayService.create(ownerId, buildHospitalityRequest(property)).getId();
            property.setHospitalityListingId(created);
            property.setHospitalityOptIn(true);
            return;
        }

        temporaryStayService.update(ownerId, property.getHospitalityListingId(), buildHospitalityUpdate(property));
        property.setHospitalityOptIn(true);
    }

    private CreateTemporaryStayRequest buildHospitalityRequest(PropertyEntity property) {
        CreateTemporaryStayRequest request = new CreateTemporaryStayRequest();
        request.setTitle(property.getTitle() + " – Φιλοξενία");
        request.setDescription(property.getDescription());
        request.setType(TemporaryStayType.HOSTING);
        request.setPricePerNight(BigDecimal.ZERO);
        request.setMinNights(1);
        request.setCostCategory(TemporaryStayCostCategory.FREE);
        request.setLocation(toTemporaryLocation(property));
        request.setContact(toTemporaryContact(property));
        request.setAmenities(property.getFeatures() != null ? new ArrayList<>(property.getFeatures()) : new ArrayList<>());
        request.setImages(property.getImages() != null ? new ArrayList<>(property.getImages()) : new ArrayList<>());
        request.setPurpose(TemporaryStayPurpose.HOSPITALITY);
        request.setLinkedPropertyId(property.getId());
        return request;
    }

    private UpdateTemporaryStayRequest buildHospitalityUpdate(PropertyEntity property) {
        UpdateTemporaryStayRequest request = new UpdateTemporaryStayRequest();
        request.setTitle(property.getTitle() + " – Φιλοξενία");
        request.setDescription(property.getDescription());
        request.setType(TemporaryStayType.HOSTING);
        request.setPricePerNight(BigDecimal.ZERO);
        request.setMinNights(1);
        request.setCostCategory(TemporaryStayCostCategory.FREE);
        request.setLocation(toTemporaryLocation(property));
        request.setContact(toTemporaryContact(property));
        request.setAmenities(property.getFeatures() != null ? new ArrayList<>(property.getFeatures()) : new ArrayList<>());
        request.setImages(property.getImages() != null ? new ArrayList<>(property.getImages()) : new ArrayList<>());
        request.setPurpose(TemporaryStayPurpose.HOSPITALITY);
        return request;
    }

    private TemporaryStayLocationDto toTemporaryLocation(PropertyEntity property) {
        TemporaryStayLocationDto dto = new TemporaryStayLocationDto();
        if (property.getLocation() != null) {
            dto.setAddress(property.getLocation().getAddress());
            dto.setCity(property.getLocation().getCity());
            dto.setPostalCode(property.getLocation().getPostalCode());
            dto.setLat(property.getLocation().getLatitude());
            dto.setLng(property.getLocation().getLongitude());
        }
        return dto;
    }

    private TemporaryStayContactDto toTemporaryContact(PropertyEntity property) {
        TemporaryStayContactDto dto = new TemporaryStayContactDto();
        if (property.getContact() != null) {
            dto.setName(property.getContact().getName());
            dto.setPhone(property.getContact().getPhone());
            dto.setEmail(property.getContact().getEmail());
        }
        return dto;
    }
}
