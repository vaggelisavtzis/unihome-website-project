export interface AvailabilityWindow {
  startDate: string;
  endDate?: string;
  label?: string;
}

export interface AvailabilitySchedule {
  unavailable: AvailabilityWindow[];
  note?: string;
  lastUpdated: string;
  calendarUrl?: string;
}

export type AvailabilityStatus = 'available' | 'blocked';

export interface AvailabilitySummary {
  status: AvailabilityStatus;
  statusLabel: string;
  nextClosureLabel?: string;
  availableFromLabel?: string;
  note?: string;
  calendarUrl?: string;
}
