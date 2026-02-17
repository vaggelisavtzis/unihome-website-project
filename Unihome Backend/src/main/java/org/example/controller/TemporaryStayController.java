package org.example.controller;

import org.example.dto.common.PagedResponse;
import org.example.dto.temporary.CreateTemporaryStayRequest;
import org.example.dto.temporary.TemporaryStayResponse;
import org.example.dto.temporary.TemporaryStaySearchCriteria;
import org.example.dto.temporary.UpdateTemporaryStayRequest;
import org.example.security.SecurityUtils;
import org.example.security.UserPrincipal;
import org.example.service.TemporaryStayService;
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
@RequestMapping("/api/temporary-stays")
public class TemporaryStayController {

    private final TemporaryStayService temporaryStayService;

    public TemporaryStayController(TemporaryStayService temporaryStayService) {
        this.temporaryStayService = temporaryStayService;
    }

    @GetMapping
    public PagedResponse<TemporaryStayResponse> search(
        @ModelAttribute TemporaryStaySearchCriteria criteria,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return temporaryStayService.search(criteria, page, size);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    public List<TemporaryStayResponse> getMine() {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        return temporaryStayService.findManagerStays(managerId);
    }

    @GetMapping("/{stayId}")
    public TemporaryStayResponse getById(@PathVariable UUID stayId) {
        UserPrincipal principal = SecurityUtils.getCurrentPrincipal();
        UUID viewerId = principal != null ? principal.getId() : null;
        return temporaryStayService.getById(stayId, viewerId);
    }

    @GetMapping("/recent")
    public List<TemporaryStayResponse> getRecent(@RequestParam(defaultValue = "6") int limit) {
        return temporaryStayService.findRecent(limit);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    @ResponseStatus(HttpStatus.CREATED)
    public TemporaryStayResponse create(@Valid @RequestBody CreateTemporaryStayRequest request) {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        return temporaryStayService.create(managerId, request);
    }

    @PutMapping("/{stayId}")
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    public TemporaryStayResponse update(@PathVariable UUID stayId, @Valid @RequestBody UpdateTemporaryStayRequest request) {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        return temporaryStayService.update(managerId, stayId, request);
    }

    @DeleteMapping("/{stayId}")
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID stayId) {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        temporaryStayService.delete(managerId, stayId);
    }

    @PostMapping("/{stayId}/hide")
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    public TemporaryStayResponse hide(@PathVariable UUID stayId) {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        return temporaryStayService.hide(managerId, stayId);
    }

    @PostMapping("/{stayId}/publish")
    @PreAuthorize("hasAnyRole('OWNER','REGULAR')")
    public TemporaryStayResponse publish(@PathVariable UUID stayId) {
        UUID managerId = SecurityUtils.requireCurrentUserId();
        return temporaryStayService.publish(managerId, stayId);
    }
}
