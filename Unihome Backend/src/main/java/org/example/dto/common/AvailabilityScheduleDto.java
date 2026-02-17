package org.example.dto.common;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AvailabilityScheduleDto {

    private List<AvailabilityWindowDto> unavailable = new ArrayList<>();
    private String note;
    private Instant lastUpdated;
    private String calendarUrl;

    public List<AvailabilityWindowDto> getUnavailable() {
        return unavailable;
    }

    public void setUnavailable(List<AvailabilityWindowDto> unavailable) {
        this.unavailable = unavailable;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public String getCalendarUrl() {
        return calendarUrl;
    }

    public void setCalendarUrl(String calendarUrl) {
        this.calendarUrl = calendarUrl;
    }
}
