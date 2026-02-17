package org.example.repository.specification;

import org.example.dto.roommate.RoommateSearchCriteria;
import org.example.model.roommate.RoommateAdEntity;
import jakarta.persistence.criteria.JoinType;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class RoommateSpecifications {

    private RoommateSpecifications() {
    }

    public static Specification<RoommateAdEntity> fromCriteria(RoommateSearchCriteria criteria) {
        Specification<RoommateAdEntity> specification = Specification.where(publishedOnly());
        if (criteria == null) {
            return specification;
        }
        if (criteria.getMinRent() != null) {
            specification = specification.and(minRent(criteria.getMinRent()));
        }
        if (criteria.getMaxRent() != null) {
            specification = specification.and(maxRent(criteria.getMaxRent()));
        }
        if (criteria.getCity() != null && !criteria.getCity().isBlank()) {
            specification = specification.and(city(criteria.getCity()));
        }
        if (criteria.getAvailableFrom() != null) {
            specification = specification.and(availableFrom(criteria.getAvailableFrom()));
        }
        if (criteria.getStudentOnly() != null && criteria.getStudentOnly()) {
            specification = specification.and(studentOnly());
        }
        if (criteria.getAmenities() != null && !criteria.getAmenities().isEmpty()) {
            specification = specification.and(amenitiesContain(criteria));
        }
        if (criteria.getInterests() != null && !criteria.getInterests().isEmpty()) {
            specification = specification.and(lifestyleContain(criteria));
        }
        return specification;
    }

    private static Specification<RoommateAdEntity> publishedOnly() {
        return (root, query, cb) -> cb.isTrue(root.get("published"));
    }

    private static Specification<RoommateAdEntity> minRent(BigDecimal min) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("monthlyRent"), min);
    }

    private static Specification<RoommateAdEntity> maxRent(BigDecimal max) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("monthlyRent"), max);
    }

    private static Specification<RoommateAdEntity> city(String city) {
        return (root, query, cb) -> cb.equal(cb.lower(root.get("location").get("city")), city.toLowerCase());
    }

    private static Specification<RoommateAdEntity> availableFrom(LocalDate date) {
        return (root, query, cb) -> cb.or(
            cb.isNull(root.get("availableFrom")),
            cb.lessThanOrEqualTo(root.get("availableFrom"), date)
        );
    }

    private static Specification<RoommateAdEntity> studentOnly() {
        return (root, query, cb) -> cb.isTrue(root.join("profile", JoinType.LEFT).get("student"));
    }

    private static Specification<RoommateAdEntity> amenitiesContain(RoommateSearchCriteria criteria) {
        return (root, query, cb) -> {
            query.distinct(true);
            var join = root.join("amenities", JoinType.LEFT);
            return join.in(criteria.getAmenities());
        };
    }

    private static Specification<RoommateAdEntity> lifestyleContain(RoommateSearchCriteria criteria) {
        return (root, query, cb) -> {
            query.distinct(true);
            var join = root.join("lifestyle", JoinType.LEFT);
            return join.in(criteria.getInterests());
        };
    }
}
