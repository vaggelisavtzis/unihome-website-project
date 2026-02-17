package org.example.controller;

import org.example.dto.common.PagedResponse;
import org.example.dto.roommate.CreateRoommateAdRequest;
import org.example.dto.roommate.RoommateAdResponse;
import org.example.dto.roommate.RoommateSearchCriteria;
import org.example.dto.roommate.SubmitRoommateRatingRequest;
import org.example.dto.roommate.UpdateRoommateAdRequest;
import org.example.security.SecurityUtils;
import org.example.service.RoommateService;
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
@RequestMapping("/api/roommates")
public class RoommateController {

    private final RoommateService roommateService;

    public RoommateController(RoommateService roommateService) {
        this.roommateService = roommateService;
    }

    @GetMapping
    public PagedResponse<RoommateAdResponse> search(
        @ModelAttribute RoommateSearchCriteria criteria,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return roommateService.search(criteria, page, size);
    }

    @GetMapping("/{adId}")
    public RoommateAdResponse getById(@PathVariable UUID adId) {
        return roommateService.getById(adId);
    }

    @GetMapping("/recent")
    public List<RoommateAdResponse> getRecent(@RequestParam(defaultValue = "6") int limit) {
        return roommateService.findRecent(limit);
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public List<RoommateAdResponse> getMine() {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        return roommateService.findMine(authorId);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public RoommateAdResponse create(@Valid @RequestBody CreateRoommateAdRequest request) {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        return roommateService.create(authorId, request);
    }

    @PutMapping("/{adId}")
    @PreAuthorize("isAuthenticated()")
    public RoommateAdResponse update(@PathVariable UUID adId, @Valid @RequestBody UpdateRoommateAdRequest request) {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        return roommateService.update(authorId, adId, request);
    }

    @DeleteMapping("/{adId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID adId) {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        roommateService.delete(authorId, adId);
    }

    @PostMapping("/{adId}/hide")
    @PreAuthorize("isAuthenticated()")
    public RoommateAdResponse hide(@PathVariable UUID adId) {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        return roommateService.hide(authorId, adId);
    }

    @PostMapping("/{adId}/publish")
    @PreAuthorize("isAuthenticated()")
    public RoommateAdResponse publish(@PathVariable UUID adId) {
        UUID authorId = SecurityUtils.requireCurrentUserId();
        return roommateService.publish(authorId, adId);
    }

    @PostMapping("/{adId}/ratings")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public RoommateAdResponse addRating(@PathVariable UUID adId, @Valid @RequestBody SubmitRoommateRatingRequest request) {
        UUID reviewerId = SecurityUtils.requireCurrentUserId();
        return roommateService.addRating(adId, reviewerId, request);
    }
}
