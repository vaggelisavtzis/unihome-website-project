package org.example.mapper;

import org.example.dto.roommate.CreateRoommateAdRequest;
import org.example.dto.roommate.RoommateAdResponse;
import org.example.dto.roommate.RoommateContactDto;
import org.example.dto.roommate.RoommateLocationDto;
import org.example.dto.roommate.RoommateProfileDto;
import org.example.dto.roommate.RoommateRatingDto;
import org.example.dto.roommate.UpdateRoommateAdRequest;
import org.example.model.roommate.RoommateAdEntity;
import org.example.model.roommate.RoommateAdMode;
import org.example.model.roommate.RoommateContactEmbeddable;
import org.example.model.roommate.RoommateLocationEmbeddable;
import org.example.model.roommate.RoommateProfileEmbeddable;
import org.example.model.roommate.RoommateRatingEntity;
import org.example.model.user.UserEntity;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class RoommateMapper {

    private final AvailabilityMapper availabilityMapper;

    public RoommateMapper(AvailabilityMapper availabilityMapper) {
        this.availabilityMapper = availabilityMapper;
    }

    public RoommateAdEntity toEntity(CreateRoommateAdRequest request, UserEntity author) {
        RoommateAdEntity entity = new RoommateAdEntity();
        entity.setAuthor(author);
        entity.setPublished(true);
        apply(entity, request);
        return entity;
    }

    public void apply(RoommateAdEntity entity, CreateRoommateAdRequest request) {
        UpdateRoommateAdRequest update = new UpdateRoommateAdRequest();
        update.setTitle(request.getTitle());
        update.setDescription(request.getDescription());
        update.setMonthlyRent(request.getMonthlyRent());
        update.setPropertyLocation(request.getPropertyLocation());
        update.setMode(request.getMode());
        update.setAvailableFrom(request.getAvailableFrom());
        update.setPreferences(new ArrayList<>(request.getPreferences()));
        update.setPropertyFeatures(new ArrayList<>(request.getPropertyFeatures()));
        update.setLifestyle(new ArrayList<>(request.getLifestyle()));
        update.setImages(new ArrayList<>(request.getImages()));
        update.setAmenities(new ArrayList<>(request.getAmenities()));
        update.setProfile(request.getProfile());
        update.setLocation(request.getLocation());
        update.setContact(request.getContact());
        update.setAvailability(request.getAvailability());
        apply(entity, update);
    }

    public void apply(RoommateAdEntity entity, UpdateRoommateAdRequest request) {
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setMonthlyRent(request.getMonthlyRent());
        entity.setPropertyLocation(request.getPropertyLocation());
        RoommateAdMode currentMode = entity.getMode() != null ? entity.getMode() : RoommateAdMode.HOST_SEEKING_ROOMMATE;
        RoommateAdMode requestedMode = request.getMode() != null ? request.getMode() : currentMode;
        entity.setMode(requestedMode);
        entity.setAvailableFrom(request.getAvailableFrom());
        entity.setPreferences(normalize(request.getPreferences()));
        entity.setPropertyFeatures(normalize(request.getPropertyFeatures()));
        entity.setLifestyle(normalize(request.getLifestyle()));
        entity.setImages(normalize(request.getImages()));
        entity.setAmenities(normalize(request.getAmenities()));
        entity.setProfile(toProfile(request.getProfile()));
        entity.setLocation(toLocation(request.getLocation()));
        entity.setContact(toContact(request.getContact()));
        entity.setAvailability(availabilityMapper.toRoommateEmbeddable(request.getAvailability()));
    }

    public RoommateAdResponse toResponse(RoommateAdEntity entity, List<RoommateRatingEntity> ratings) {
        if (entity == null) {
            return null;
        }
        RoommateAdResponse dto = new RoommateAdResponse();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setMonthlyRent(entity.getMonthlyRent());
        dto.setPropertyLocation(entity.getPropertyLocation());
        dto.setMode(entity.getMode() != null ? entity.getMode() : RoommateAdMode.HOST_SEEKING_ROOMMATE);
        dto.setAvailableFrom(entity.getAvailableFrom());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setPublished(entity.isPublished());
        if (entity.getAuthor() != null) {
            dto.setAuthorId(entity.getAuthor().getId());
            dto.setAuthorName(formatName(entity.getAuthor()));
        }
        dto.setPreferences(normalize(entity.getPreferences()));
        dto.setPropertyFeatures(normalize(entity.getPropertyFeatures()));
        dto.setLifestyle(normalize(entity.getLifestyle()));
        dto.setImages(normalize(entity.getImages()));
        dto.setAmenities(normalize(entity.getAmenities()));
        dto.setProfile(toProfileDto(entity.getProfile()));
        dto.setLocation(toLocationDto(entity.getLocation()));
        dto.setContact(toContactDto(entity.getContact()));
        dto.setAvailability(availabilityMapper.toDto(entity.getAvailability()));
        applyRatings(dto, ratings);
        return dto;
    }

    private void applyRatings(RoommateAdResponse response, List<RoommateRatingEntity> ratings) {
        if (ratings == null || ratings.isEmpty()) {
            response.setRatings(new ArrayList<>());
            response.setRatingCount(0);
            response.setAverageRating(null);
            response.setLastRatedAt(null);
            return;
        }
        List<RoommateRatingDto> ratingDtos = ratings.stream()
            .sorted(Comparator.comparing(RoommateRatingEntity::getCreatedAt).reversed())
            .map(this::toRatingDto)
            .collect(Collectors.toList());
        response.setRatings(ratingDtos);
        response.setRatingCount(ratings.size());
        double average = ratings.stream()
            .map(RoommateRatingEntity::getScore)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
        response.setAverageRating(Math.round(average * 10.0) / 10.0);
        Instant latest = ratings.stream()
            .map(RoommateRatingEntity::getCreatedAt)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null);
        response.setLastRatedAt(latest);
    }

    private RoommateRatingDto toRatingDto(RoommateRatingEntity entity) {
        RoommateRatingDto dto = new RoommateRatingDto();
        dto.setId(entity.getId());
        dto.setReviewerId(entity.getReviewerId());
        dto.setReviewerName(entity.getReviewerName());
        dto.setScore(entity.getScore());
        dto.setComment(entity.getComment());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private RoommateProfileEmbeddable toProfile(RoommateProfileDto dto) {
        if (dto == null) {
            return null;
        }
        RoommateProfileEmbeddable embeddable = new RoommateProfileEmbeddable();
        embeddable.setName(dto.getName());
        embeddable.setAge(dto.getAge());
        embeddable.setGender(dto.getGender());
        embeddable.setUniversity(dto.getUniversity());
        embeddable.setDepartment(dto.getDepartment());
        embeddable.setSemester(dto.getSemester());
        embeddable.setBio(dto.getBio());
        embeddable.setAvatar(dto.getAvatar());
        embeddable.setStudent(dto.getStudent());
        return embeddable;
    }

    private RoommateProfileDto toProfileDto(RoommateProfileEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        RoommateProfileDto dto = new RoommateProfileDto();
        dto.setName(embeddable.getName());
        dto.setAge(embeddable.getAge());
        dto.setGender(embeddable.getGender());
        dto.setUniversity(embeddable.getUniversity());
        dto.setDepartment(embeddable.getDepartment());
        dto.setSemester(embeddable.getSemester());
        dto.setBio(embeddable.getBio());
        dto.setAvatar(embeddable.getAvatar());
        dto.setStudent(embeddable.getStudent());
        return dto;
    }

    private RoommateLocationEmbeddable toLocation(RoommateLocationDto dto) {
        if (dto == null) {
            return null;
        }
        RoommateLocationEmbeddable embeddable = new RoommateLocationEmbeddable();
        embeddable.setCity(dto.getCity());
        embeddable.setArea(dto.getArea());
        embeddable.setProximity(dto.getProximity());
        return embeddable;
    }

    private RoommateLocationDto toLocationDto(RoommateLocationEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        RoommateLocationDto dto = new RoommateLocationDto();
        dto.setCity(embeddable.getCity());
        dto.setArea(embeddable.getArea());
        dto.setProximity(embeddable.getProximity());
        return dto;
    }

    private RoommateContactEmbeddable toContact(RoommateContactDto dto) {
        if (dto == null) {
            return null;
        }
        RoommateContactEmbeddable embeddable = new RoommateContactEmbeddable();
        embeddable.setName(dto.getName());
        embeddable.setPhone(dto.getPhone());
        embeddable.setEmail(dto.getEmail());
        embeddable.setInstagram(dto.getInstagram());
        embeddable.setFacebook(dto.getFacebook());
        return embeddable;
    }

    private RoommateContactDto toContactDto(RoommateContactEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        RoommateContactDto dto = new RoommateContactDto();
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
        return values.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .distinct()
            .collect(Collectors.toList());
    }

    private String formatName(UserEntity user) {
        String first = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String last = user.getLastName() != null ? user.getLastName().trim() : "";
        return (first + " " + last).trim();
    }
}
