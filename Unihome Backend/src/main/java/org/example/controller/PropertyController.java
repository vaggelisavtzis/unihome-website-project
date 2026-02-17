package org.example.controller;

import org.example.dto.common.PagedResponse;
import org.example.dto.property.CreatePropertyRequest;
import org.example.dto.property.PropertyResponse;
import org.example.dto.property.PropertySearchCriteria;
import org.example.dto.property.UpdatePropertyRequest;
import org.example.security.SecurityUtils;
import org.example.security.UserPrincipal;
import org.example.service.PropertyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping
    public PagedResponse<PropertyResponse> search(
        @ModelAttribute PropertySearchCriteria criteria,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return propertyService.search(criteria, page, size);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    public List<PropertyResponse> getMine() {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        return propertyService.findOwnerProperties(ownerId);
    }

    @GetMapping("/{propertyId}")
    public PropertyResponse getById(@PathVariable UUID propertyId) {
        UserPrincipal principal = SecurityUtils.getCurrentPrincipal();
        UUID viewerId = principal != null ? principal.getId() : null;
        return propertyService.getById(propertyId, viewerId);
    }

    @GetMapping("/recent")
    public List<PropertyResponse> getRecent(@RequestParam(defaultValue = "6") int limit) {
        return propertyService.findRecent(limit);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public PropertyResponse create(@Valid @RequestBody CreatePropertyRequest request) {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        return propertyService.create(ownerId, request);
    }

    @PutMapping("/{propertyId}")
    @PreAuthorize("hasRole('OWNER')")
    public PropertyResponse update(@PathVariable UUID propertyId, @Valid @RequestBody UpdatePropertyRequest request) {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        return propertyService.update(ownerId, propertyId, request);
    }

    @DeleteMapping("/{propertyId}")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID propertyId) {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        propertyService.delete(ownerId, propertyId);
    }

    @PostMapping("/{propertyId}/hide")
    @PreAuthorize("hasRole('OWNER')")
    public PropertyResponse hide(@PathVariable UUID propertyId) {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        return propertyService.hide(ownerId, propertyId);
    }

    @PostMapping("/{propertyId}/publish")
    @PreAuthorize("hasRole('OWNER')")
    public PropertyResponse publish(@PathVariable UUID propertyId) {
        UUID ownerId = SecurityUtils.requireCurrentUserId();
        return propertyService.publish(ownerId, propertyId);
    }
}
