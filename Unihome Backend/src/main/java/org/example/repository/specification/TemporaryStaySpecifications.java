package org.example.repository.specification;

import org.example.dto.temporary.TemporaryStaySearchCriteria;
import org.example.model.temporary.TemporaryStayEntity;
import jakarta.persistence.criteria.JoinType;
import java.math.BigDecimal;
import org.springframework.data.jpa.domain.Specification;

public final class TemporaryStaySpecifications {

    private TemporaryStaySpecifications() {
    }

    public static Specification<TemporaryStayEntity> fromCriteria(TemporaryStaySearchCriteria criteria) {
        Specification<TemporaryStayEntity> specification = Specification.where(publishedOnly());
        if (criteria == null) {
            return specification;
        }
        if (criteria.getTypes() != null && !criteria.getTypes().isEmpty()) {
            specification = specification.and(typeIn(criteria));
        }
        if (criteria.getMinPrice() != null) {
            specification = specification.and(minPrice(criteria.getMinPrice()));
        }
        if (criteria.getMaxPrice() != null) {
            specification = specification.and(maxPrice(criteria.getMaxPrice()));
        }
        if (criteria.getCity() != null && !criteria.getCity().isBlank()) {
            specification = specification.and(city(criteria.getCity()));
        }
        if (criteria.getCostCategory() != null) {
            specification = specification.and(costCategory(criteria));
        }
        if (criteria.getPurpose() != null) {
            specification = specification.and(purpose(criteria));
        }
        if (criteria.getAmenities() != null && !criteria.getAmenities().isEmpty()) {
            specification = specification.and(amenitiesContain(criteria));
        }
        return specification;
    }

    private static Specification<TemporaryStayEntity> publishedOnly() {
        return (root, query, cb) -> cb.isTrue(root.get("published"));
    }

    private static Specification<TemporaryStayEntity> typeIn(TemporaryStaySearchCriteria criteria) {
        return (root, query, cb) -> root.get("type").in(criteria.getTypes());
    }

    private static Specification<TemporaryStayEntity> minPrice(BigDecimal min) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("pricePerNight"), min);
    }

    private static Specification<TemporaryStayEntity> maxPrice(BigDecimal max) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("pricePerNight"), max);
    }

    private static Specification<TemporaryStayEntity> city(String city) {
        return (root, query, cb) -> cb.equal(cb.lower(root.get("location").get("city")), city.toLowerCase());
    }

    private static Specification<TemporaryStayEntity> costCategory(TemporaryStaySearchCriteria criteria) {
        return (root, query, cb) -> cb.equal(root.get("costCategory"), criteria.getCostCategory());
    }

    private static Specification<TemporaryStayEntity> amenitiesContain(TemporaryStaySearchCriteria criteria) {
        return (root, query, cb) -> {
            query.distinct(true);
            var join = root.join("amenities", JoinType.LEFT);
            return join.in(criteria.getAmenities());
        };
    }

    private static Specification<TemporaryStayEntity> purpose(TemporaryStaySearchCriteria criteria) {
        return (root, query, cb) -> cb.equal(root.get("purpose"), criteria.getPurpose());
    }
}
