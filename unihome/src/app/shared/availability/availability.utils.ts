import { AvailabilitySchedule, AvailabilitySummary, AvailabilityWindow } from '../../models/availability.model';

const GREEK_LOCALE = 'el-GR';

const formatDate = (value: string): string => {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(GREEK_LOCALE, {
    day: 'numeric',
    month: 'long'
  }).format(parsed);
};

const normalizeWindow = (window: AvailabilityWindow): AvailabilityWindow | null => {
  if (!window || typeof window !== 'object') {
    return null;
  }
  if (!window.startDate || Number.isNaN(new Date(window.startDate).getTime())) {
    return null;
  }
  if (window.endDate && Number.isNaN(new Date(window.endDate).getTime())) {
    return null;
  }
  return window;
};

const sortWindows = (windows: AvailabilityWindow[]): AvailabilityWindow[] => {
  return [...windows]
    .map(window => normalizeWindow(window))
    .filter((window): window is AvailabilityWindow => !!window)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

const isWithinWindow = (window: AvailabilityWindow, reference: Date): boolean => {
  const start = new Date(window.startDate).getTime();
  const end = window.endDate ? new Date(window.endDate).getTime() : undefined;
  const point = reference.getTime();
  if (Number.isNaN(start)) {
    return false;
  }
  if (end !== undefined && Number.isNaN(end)) {
    return false;
  }
  if (point < start) {
    return false;
  }
  if (end === undefined) {
    return true;
  }
  return point <= end;
};

const formatWindowRange = (window: AvailabilityWindow): string => {
  const startLabel = formatDate(window.startDate);
  const endLabel = window.endDate ? formatDate(window.endDate) : undefined;
  if (!startLabel && !endLabel) {
    return window.label ?? '';
  }
  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`;
  }
  if (startLabel && !endLabel) {
    return `Από ${startLabel}`;
  }
  return endLabel ?? '';
};

export const summarizeAvailability = (
  schedule?: AvailabilitySchedule,
  referenceDate: Date = new Date()
): AvailabilitySummary => {
  if (!schedule) {
    return {
      status: 'available',
      statusLabel: 'Διαθέσιμο τώρα'
    };
  }

  const windows = sortWindows(schedule.unavailable ?? []);
  const current = windows.find(window => isWithinWindow(window, referenceDate));

  if (current) {
    const range = formatWindowRange(current);
    let label = 'Μη διαθέσιμο προσωρινά';
    if (current.label) {
      label = `${current.label}`;
    } else if (range) {
      label = `Μη διαθέσιμο έως ${range}`;
    }

    const availableFrom = current.endDate ? formatDate(current.endDate) : '';
    const availableFromLabel = availableFrom ? `Διαθέσιμο ξανά από ${availableFrom}` : undefined;

    return {
      status: 'blocked',
      statusLabel: label,
      nextClosureLabel: undefined,
      availableFromLabel,
      note: schedule.note,
      calendarUrl: schedule.calendarUrl
    };
  }

  const next = windows.find(window => new Date(window.startDate).getTime() > referenceDate.getTime());
  const nextLabel = next ? `Κλειστό ${formatWindowRange(next)}` : undefined;

  return {
    status: 'available',
    statusLabel: 'Διαθέσιμο τώρα',
    nextClosureLabel: nextLabel,
    availableFromLabel: undefined,
    note: schedule.note,
    calendarUrl: schedule.calendarUrl
  };
};
