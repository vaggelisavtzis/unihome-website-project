package org.example.model.availability;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Embeddable
public class TemporaryAvailabilityScheduleEmbeddable {

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "temporary_stay_unavailable_windows",
            joinColumns = @JoinColumn(name = "stay_id")
    )
    @OrderColumn(name = "window_order")
    private List<AvailabilityWindowEmbeddable> unavailable = new ArrayList<>();

    @Column(name = "availability_note", length = 2000)
    private String note;

    @Column(name = "availability_last_updated")
    private Instant lastUpdated;

    @Column(name = "availability_calendar_url")
    private String calendarUrl;

    public List<AvailabilityWindowEmbeddable> getUnavailable() {
        return unavailable;
    }

    public void setUnavailable(List<AvailabilityWindowEmbeddable> unavailable) {
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