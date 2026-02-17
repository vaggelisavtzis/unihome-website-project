package org.example.service;

import org.example.dto.common.PagedResponse;
import org.example.dto.roommate.CreateRoommateAdRequest;
import org.example.dto.roommate.RoommateAdResponse;
import org.example.dto.roommate.RoommateSearchCriteria;
import org.example.dto.roommate.SubmitRoommateRatingRequest;
import org.example.dto.roommate.UpdateRoommateAdRequest;
import org.example.exception.ForbiddenException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.RoommateMapper;
import org.example.model.roommate.RoommateAdEntity;
import org.example.model.roommate.RoommateRatingEntity;
import org.example.model.user.UserEntity;
import org.example.repository.RoommateAdRepository;
import org.example.repository.RoommateRatingRepository;
import org.example.repository.specification.RoommateSpecifications;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoommateService {

    private final RoommateAdRepository roommateAdRepository;
    private final RoommateRatingRepository roommateRatingRepository;
    private final RoommateMapper roommateMapper;
    private final UserService userService;

    public RoommateService(
        RoommateAdRepository roommateAdRepository,
        RoommateRatingRepository roommateRatingRepository,
        RoommateMapper roommateMapper,
        UserService userService
    ) {
        this.roommateAdRepository = roommateAdRepository;
        this.roommateRatingRepository = roommateRatingRepository;
        this.roommateMapper = roommateMapper;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<RoommateAdResponse> search(RoommateSearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Specification<RoommateAdEntity> specification = RoommateSpecifications.fromCriteria(criteria);
        Page<RoommateAdEntity> result = roommateAdRepository.findAll(specification, pageable);
        List<RoommateAdResponse> items = result.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return new PagedResponse<>(items, result.getTotalElements(), result.getTotalPages(), result.getNumber(), result.getSize());
    }

    @Transactional
    public RoommateAdResponse create(UUID authorId, CreateRoommateAdRequest request) {
        UserEntity author = userService.findUser(authorId);
        RoommateAdEntity entity = roommateMapper.toEntity(request, author);
        entity.setPublished(true);
        RoommateAdEntity saved = roommateAdRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public RoommateAdResponse update(UUID authorId, UUID adId, UpdateRoommateAdRequest request) {
        RoommateAdEntity ad = requireAd(adId);
        ensureAuthor(authorId, ad);
        roommateMapper.apply(ad, request);
        return toResponse(ad);
    }

    @Transactional
    public void delete(UUID authorId, UUID adId) {
        RoommateAdEntity ad = requireAd(adId);
        ensureAuthor(authorId, ad);
        roommateAdRepository.delete(ad);
    }

    @Transactional(readOnly = true)
    public List<RoommateAdResponse> findMine(UUID authorId) {
        List<RoommateAdEntity> ads = roommateAdRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
        return ads.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public RoommateAdResponse hide(UUID authorId, UUID adId) {
        RoommateAdEntity ad = requireAd(adId);
        ensureAuthor(authorId, ad);
        ad.setPublished(false);
        return toResponse(ad);
    }

    @Transactional
    public RoommateAdResponse publish(UUID authorId, UUID adId) {
        RoommateAdEntity ad = requireAd(adId);
        ensureAuthor(authorId, ad);
        ad.setPublished(true);
        return toResponse(ad);
    }

    @Transactional(readOnly = true)
    public RoommateAdResponse getById(UUID adId) {
        RoommateAdEntity ad = requireAd(adId);
        return toResponse(ad);
    }

    @Transactional
    public RoommateAdResponse addRating(UUID adId, UUID reviewerId, SubmitRoommateRatingRequest request) {
        RoommateAdEntity ad = requireAd(adId);
        userService.findUser(reviewerId);
        if (ad.getAuthor() != null && ad.getAuthor().getId().equals(reviewerId)) {
            throw new ForbiddenException("You cannot rate your own listing");
        }
        RoommateRatingEntity rating = new RoommateRatingEntity();
        rating.setAd(ad);
        rating.setReviewerId(reviewerId);
        rating.setReviewerName(request.getReviewerName());
        rating.setScore(request.getScore());
        rating.setComment(request.getComment());
        roommateRatingRepository.save(rating);
        return toResponse(ad);
    }

    @Transactional(readOnly = true)
    public List<RoommateAdResponse> findRecent(int limit) {
        if (limit <= 0) {
            return List.of();
        }
        List<RoommateAdEntity> ads = roommateAdRepository.findTop6ByPublishedTrueOrderByCreatedAtDesc();
        return ads.stream().limit(limit).map(this::toResponse).collect(Collectors.toList());
    }

    private RoommateAdResponse toResponse(RoommateAdEntity entity) {
        List<RoommateRatingEntity> ratings = roommateRatingRepository.findByAdId(entity.getId());
        return roommateMapper.toResponse(entity, ratings);
    }

    private RoommateAdEntity requireAd(UUID adId) {
        return roommateAdRepository.findById(adId)
            .orElseThrow(() -> new ResourceNotFoundException("Roommate listing not found"));
    }

    private void ensureAuthor(UUID userId, RoommateAdEntity ad) {
        if (ad.getAuthor() == null || !ad.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this roommate listing");
        }
    }
}
