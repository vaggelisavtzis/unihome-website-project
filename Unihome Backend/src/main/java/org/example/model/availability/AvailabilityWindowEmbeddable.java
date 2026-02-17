package org.example.model.availability;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
public class AvailabilityWindowEmbeddable {

    @Column(name = "window_start_date")
    private LocalDate startDate;

    @Column(name = "window_end_date")
    private LocalDate endDate;

    @Column(name = "window_label")
    private String label;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
