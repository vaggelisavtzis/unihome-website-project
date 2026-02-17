package org.example.mapper;

import org.example.dto.common.AvailabilityScheduleDto;
import org.example.dto.common.AvailabilityWindowDto;
import org.example.model.availability.AvailabilityScheduleEmbeddable;
import org.example.model.availability.AvailabilityWindowEmbeddable;
import org.example.model.availability.RoommateAvailabilityScheduleEmbeddable;
import org.example.model.availability.TemporaryAvailabilityScheduleEmbeddable;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AvailabilityMapper {

    public AvailabilityScheduleEmbeddable toEmbeddable(AvailabilityScheduleDto dto) {
        if (dto == null) {
            return null;
        }
        AvailabilityScheduleEmbeddable embeddable = new AvailabilityScheduleEmbeddable();
        embeddable.setUnavailable(mapWindows(dto.getUnavailable()));
        embeddable.setNote(dto.getNote());
        embeddable.setLastUpdated(dto.getLastUpdated());
        embeddable.setCalendarUrl(dto.getCalendarUrl());
        return embeddable;
    }

    public TemporaryAvailabilityScheduleEmbeddable toTemporaryEmbeddable(AvailabilityScheduleDto dto) {
        if (dto == null) {
            return null;
        }
        TemporaryAvailabilityScheduleEmbeddable embeddable = new TemporaryAvailabilityScheduleEmbeddable();
        embeddable.setUnavailable(mapWindows(dto.getUnavailable()));
        embeddable.setNote(dto.getNote());
        embeddable.setLastUpdated(dto.getLastUpdated());
        embeddable.setCalendarUrl(dto.getCalendarUrl());
        return embeddable;
    }

    public RoommateAvailabilityScheduleEmbeddable toRoommateEmbeddable(AvailabilityScheduleDto dto) {
        if (dto == null) {
            return null;
        }
        RoommateAvailabilityScheduleEmbeddable embeddable = new RoommateAvailabilityScheduleEmbeddable();
        embeddable.setUnavailable(mapWindows(dto.getUnavailable()));
        embeddable.setNote(dto.getNote());
        embeddable.setLastUpdated(dto.getLastUpdated());
        embeddable.setCalendarUrl(dto.getCalendarUrl());
        return embeddable;
    }

    public AvailabilityScheduleDto toDto(AvailabilityScheduleEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        AvailabilityScheduleDto dto = new AvailabilityScheduleDto();
        dto.setUnavailable(embeddable.getUnavailable().stream()
            .filter(Objects::nonNull)
            .map(this::toDto)
            .collect(Collectors.toList()));
        dto.setNote(embeddable.getNote());
        dto.setLastUpdated(embeddable.getLastUpdated());
        dto.setCalendarUrl(embeddable.getCalendarUrl());
        return dto;
    }

    public AvailabilityScheduleDto toDto(TemporaryAvailabilityScheduleEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        AvailabilityScheduleDto dto = new AvailabilityScheduleDto();
        dto.setUnavailable(embeddable.getUnavailable().stream()
            .filter(Objects::nonNull)
            .map(this::toDto)
            .collect(Collectors.toList()));
        dto.setNote(embeddable.getNote());
        dto.setLastUpdated(embeddable.getLastUpdated());
        dto.setCalendarUrl(embeddable.getCalendarUrl());
        return dto;
    }

    public AvailabilityScheduleDto toDto(RoommateAvailabilityScheduleEmbeddable embeddable) {
        if (embeddable == null) {
            return null;
        }
        AvailabilityScheduleDto dto = new AvailabilityScheduleDto();
        dto.setUnavailable(embeddable.getUnavailable().stream()
            .filter(Objects::nonNull)
            .map(this::toDto)
            .collect(Collectors.toList()));
        dto.setNote(embeddable.getNote());
        dto.setLastUpdated(embeddable.getLastUpdated());
        dto.setCalendarUrl(embeddable.getCalendarUrl());
        return dto;
    }

    private List<AvailabilityWindowEmbeddable> mapWindows(List<AvailabilityWindowDto> source) {
        if (source == null) {
            return java.util.Collections.emptyList();
        }
        return source.stream()
            .filter(Objects::nonNull)
            .map(this::toEmbeddable)
            .collect(Collectors.toList());
    }

    private AvailabilityWindowEmbeddable toEmbeddable(AvailabilityWindowDto dto) {
        AvailabilityWindowEmbeddable embeddable = new AvailabilityWindowEmbeddable();
        embeddable.setStartDate(dto.getStartDate());
        embeddable.setEndDate(dto.getEndDate());
        embeddable.setLabel(dto.getLabel());
        return embeddable;
    }

    private AvailabilityWindowDto toDto(AvailabilityWindowEmbeddable embeddable) {
        AvailabilityWindowDto dto = new AvailabilityWindowDto();
        dto.setStartDate(embeddable.getStartDate());
        dto.setEndDate(embeddable.getEndDate());
        dto.setLabel(embeddable.getLabel());
        return dto;
    }
}
