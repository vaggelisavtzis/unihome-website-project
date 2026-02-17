package org.example.repository.specification;

import org.example.dto.property.PropertySearchCriteria;
import org.example.model.property.PropertyEntity;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class PropertySpecifications {

    private PropertySpecifications() {
    }

    public static Specification<PropertyEntity> fromCriteria(PropertySearchCriteria criteria) {
        Specification<PropertyEntity> specification = Specification.where(null);
        specification = specification.and((root, query, cb) -> cb.isTrue(root.get("published")));
        if (criteria == null) {
            return specification;
        }

        if (criteria.getTypes() != null && !criteria.getTypes().isEmpty()) {
            specification = specification.and(typeIn(criteria));
        }
        if (criteria.getMinPrice() != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), criteria.getMinPrice()));
        }
        if (criteria.getMaxPrice() != null) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), criteria.getMaxPrice()));
        }
        if (criteria.getMinArea() != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("area"), criteria.getMinArea()));
        }
        if (criteria.getMaxArea() != null) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("area"), criteria.getMaxArea()));
        }
        if (criteria.getMinRooms() != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rooms"), criteria.getMinRooms()));
        }
        if (criteria.getCity() != null && !criteria.getCity().isBlank()) {
            String likePattern = "%" + criteria.getCity().toLowerCase().trim() + "%";
            specification = specification.and((root, query, cb) -> cb.like(cb.lower(root.get("location").get("city")), likePattern));
        }
        if (criteria.getFurnished() != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.join("basics", JoinType.LEFT).get("furnished"), criteria.getFurnished()));
        }
        if (criteria.getHasDamage() != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.join("basics", JoinType.LEFT).get("hasDamage"), criteria.getHasDamage()));
        }
        if (criteria.getSearch() != null && !criteria.getSearch().isBlank()) {
            String term = "%" + criteria.getSearch().toLowerCase().trim() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), term),
                cb.like(cb.lower(root.get("description")), term)
            ));
        }
        return specification;
    }

    private static Specification<PropertyEntity> typeIn(PropertySearchCriteria criteria) {
        return (root, query, cb) -> root.get("type").in(criteria.getTypes());
    }
}
