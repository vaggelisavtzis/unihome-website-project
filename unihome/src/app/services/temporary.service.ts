import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilitySchedule, AvailabilityWindow } from '../models/availability.model';
import { TemporaryStay, TemporaryStayCostCategory, TemporaryStayPurpose, TemporaryStayType } from '../models/temporary-stay.model';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { matchesSearchNeedle } from '../shared/utils/search-normalizer';

interface ApiPagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
}

interface ApiTemporaryStay {
  id: string;
  title?: string;
  description?: string;
  type: ApiTemporaryStayType;
  pricePerNight?: number | string;
  minNights?: number | string;
  costCategory?: ApiTemporaryStayCostCategory;
  location?: ApiTemporaryStayLocation;
  amenities?: string[];
  images?: string[];
  contact?: ApiTemporaryStayContact;
  availability?: ApiAvailability;
  createdAt?: string;
  purpose?: ApiTemporaryStayPurpose;
  linkedPropertyId?: string;
  published?: boolean;
}

type ApiTemporaryStayType = 'HOTEL' | 'ROOM' | 'AIRBNB' | 'HOSTEL' | 'HOSTING';

type ApiTemporaryStayCostCategory = 'FREE' | 'PAID';

type ApiTemporaryStayPurpose = 'HOSPITALITY' | 'ACCOMMODATION';

interface ApiTemporaryStayLocation {
  address?: string;
  city?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

interface ApiTemporaryStayContact {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

interface ApiAvailability {
  unavailable?: ApiAvailabilityWindow[];
  note?: string;
  calendarUrl?: string;
  lastUpdated?: string;
}

interface ApiAvailabilityWindow {
  startDate?: string;
  endDate?: string;
  label?: string;
}

interface CreateTemporaryStayRequestPayload {
  title: string;
  description: string;
  type: ApiTemporaryStayType;
  pricePerNight: number;
  minNights: number;
  costCategory: ApiTemporaryStayCostCategory;
  location?: ApiTemporaryStayLocation;
  amenities: string[];
  images: string[];
  contact?: ApiTemporaryStayContact;
  availability?: ApiAvailabilityRequest;
  purpose: ApiTemporaryStayPurpose;
  linkedPropertyId?: string;
}

interface UpdateTemporaryStayRequestPayload extends CreateTemporaryStayRequestPayload {}

interface ApiAvailabilityRequest {
  unavailable?: ApiAvailabilityWindowRequest[];
  note?: string;
  calendarUrl?: string;
}

interface ApiAvailabilityWindowRequest {
  startDate: string;
  endDate?: string;
  label?: string;
}

export interface TemporaryStayFilters {
  type?: TemporaryStayType;
  maxPrice?: number;
  location?: string;
  costCategory?: TemporaryStayCostCategory;
  purpose?: TemporaryStayPurpose;
}

export interface TemporaryStayPayload {
  title: string;
  description: string;
  type: TemporaryStayType;
  pricePerNight: number;
  minNights: number;
  costCategory: TemporaryStayCostCategory;
  location?: {
    address?: string;
    city?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  amenities?: string[];
  images?: string[];
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  availability?: {
    unavailable?: Array<{
      startDate: string;
      endDate?: string;
      label?: string;
    }>;
    note?: string;
    calendarUrl?: string;
  };
  purpose?: TemporaryStayPurpose;
  linkedPropertyId?: string;
}

const STAY_TYPE_FROM_API: Record<ApiTemporaryStayType, TemporaryStayType> = {
  HOTEL: 'Ξενοδοχείο',
  ROOM: 'Δωμάτιο',
  AIRBNB: 'Airbnb',
  HOSTEL: 'Hostel',
  HOSTING: 'Φιλοξενία'
};

const STAY_TYPE_TO_API: Record<TemporaryStayType, ApiTemporaryStayType> = {
  'Ξενοδοχείο': 'HOTEL',
  'Δωμάτιο': 'ROOM',
  Airbnb: 'AIRBNB',
  Hostel: 'HOSTEL',
  'Φιλοξενία': 'HOSTING'
};

const COST_CATEGORY_FROM_API: Record<ApiTemporaryStayCostCategory, TemporaryStayCostCategory> = {
  FREE: 'free',
  PAID: 'paid'
};

const COST_CATEGORY_TO_API: Record<TemporaryStayCostCategory, ApiTemporaryStayCostCategory> = {
  free: 'FREE',
  paid: 'PAID'
};

const STAY_PURPOSE_FROM_API: Record<ApiTemporaryStayPurpose, TemporaryStayPurpose> = {
  HOSPITALITY: 'hospitality',
  ACCOMMODATION: 'accommodation'
};

const STAY_PURPOSE_TO_API: Record<TemporaryStayPurpose, ApiTemporaryStayPurpose> = {
  hospitality: 'HOSPITALITY',
  accommodation: 'ACCOMMODATION'
};

const FALLBACK_CONTACT = {
  name: 'Ομάδα Unihome',
  phone: '2101234567',
  email: 'info@unihome.gr'
};

const FALLBACK_IMAGE = 'assets/carousel/1.jpg';

@Injectable({ providedIn: 'root' })
export class TemporaryService {
  private readonly baseUrl = `${environment.apiUrl}/temporary-stays`;
  private readonly staysSubject = new BehaviorSubject<TemporaryStay[]>([]);
  readonly stays$ = this.staysSubject.asObservable();

  private readonly mineStaysSubject = new BehaviorSubject<TemporaryStay[]>([]);
  readonly mineStays$ = this.mineStaysSubject.asObservable();

  private isLoaded = false;
  private isLoading = false;
  private readonly pendingFetch = new Set<string>();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    this.refresh();
  }

  ensureLoaded(): void {
    if (!this.isLoaded && !this.isLoading) {
      this.refresh();
    }
  }

  refresh(filters: TemporaryStayFilters = {}): void {
    this.isLoading = true;
    this.fetchTemporaryStays(filters)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        error: () => {
          
        }
      });
  }

  fetchTemporaryStays(filters: TemporaryStayFilters = {}): Observable<TemporaryStay[]> {
    const params = this.buildQueryParams(filters);
    return this.http
      .get<ApiPagedResponse<ApiTemporaryStay>>(this.baseUrl, { params })
      .pipe(
        map(response => (response.items ?? []).map(item => this.mapStay(item))),
        tap(stays => {
          this.staysSubject.next(this.sortByRecency(stays));
          this.isLoaded = true;
        }),
        catchError(error => {
          console.error('Failed to fetch temporary stays', error);
          return throwError(() => error);
        })
      );
  }

  getSnapshot(): TemporaryStay[] {
    return this.staysSubject.value;
  }

  getMineSnapshot(): TemporaryStay[] {
    return this.mineStaysSubject.value;
  }

  refreshMine(): void {
    if (!this.authService.isLoggedIn()) {
      this.mineStaysSubject.next([]);
      return;
    }

    this.http
      .get<ApiTemporaryStay[]>(`${this.baseUrl}/mine`)
      .pipe(
        map(items => (items ?? []).map(item => this.mapStay(item))),
        tap(stays => this.mineStaysSubject.next(this.sortByRecency(stays))),
        catchError(error => {
          console.error('Failed to fetch my temporary stays', error);
          return of<TemporaryStay[]>([]);
        })
      )
      .subscribe();
  }

  filterStays(filters: TemporaryStayFilters): TemporaryStay[] {
    const stays = this.staysSubject.value;
    if (!stays.length) {
      return [];
    }

    return stays.filter(stay => {
      if (filters.type && stay.type !== filters.type) {
        return false;
      }

      if (typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice)) {
        if (stay.costCategory !== 'free' && stay.pricePerNight > filters.maxPrice) {
          return false;
        }
      }

      if (
        filters.location &&
        !matchesSearchNeedle(
          [stay.location.city, stay.location.address, stay.location.postalCode],
          filters.location
        )
      ) {
        return false;
      }

      if (filters.costCategory && stay.costCategory !== filters.costCategory) {
        return false;
      }

      if (filters.purpose && stay.purpose !== filters.purpose) {
        return false;
      }

      return true;
    });
  }

  ensureStayLoaded(stayId: string): void {
    const trimmed = stayId?.trim();
    if (!trimmed || this.pendingFetch.has(trimmed)) {
      return;
    }

    if (this.staysSubject.value.some(stay => stay.id === trimmed)) {
      return;
    }

    this.pendingFetch.add(trimmed);

    this.http
      .get<ApiTemporaryStay>(`${this.baseUrl}/${trimmed}`)
      .pipe(
        map(api => this.mapStay(api)),
        tap(stay => this.upsert(stay)),
        catchError(error => {
          console.error(`Failed to fetch temporary stay ${trimmed}`, error);
          return of<TemporaryStay | null>(null);
        }),
        finalize(() => this.pendingFetch.delete(trimmed))
      )
      .subscribe();
  }

  getStayById(stayId: string): TemporaryStay | undefined {
    const trimmed = stayId?.trim();
    if (!trimmed) {
      return undefined;
    }

    const existing = this.staysSubject.value.find(stay => stay.id === trimmed);
    if (existing) {
      return existing;
    }

    this.ensureStayLoaded(trimmed);
    return undefined;
  }

  addStay(payload: TemporaryStayPayload): Observable<TemporaryStay> {
    this.safeRequireUser();

    let request: CreateTemporaryStayRequestPayload;
    try {
      request = this.buildCreateRequestPayload(payload);
    } catch (error) {
      return throwError(() => error instanceof Error ? error : new Error('Τα στοιχεία δεν είναι έγκυρα.'));
    }

    return this.http.post<ApiTemporaryStay>(this.baseUrl, request).pipe(
      map(api => this.mapStay(api)),
      tap(stay => {
        this.upsert(stay);
        this.upsertMine(stay);
      }),
      catchError(error => {
        console.error('Failed to create temporary stay', error);
        return throwError(() => this.toError(error, 'Δεν ήταν δυνατή η αποθήκευση.'));
      })
    );
  }

  updateStay(stayId: string, payload: TemporaryStayPayload): Observable<TemporaryStay> {
    const trimmed = stayId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η καταχώρηση δεν βρέθηκε.'));
    }

    this.safeRequireUser();

    let request: UpdateTemporaryStayRequestPayload;
    try {
      request = this.buildUpdateRequestPayload(payload);
    } catch (error) {
      return throwError(() => error instanceof Error ? error : new Error('Τα στοιχεία δεν είναι έγκυρα.'));
    }

    return this.http.put<ApiTemporaryStay>(`${this.baseUrl}/${trimmed}`, request).pipe(
      map(api => this.mapStay(api)),
      tap(stay => {
        this.upsert(stay);
        this.upsertMine(stay);
      }),
      catchError(error => {
        console.error(`Failed to update temporary stay ${trimmed}`, error);
        return throwError(() => this.toError(error, 'Η ενημέρωση απέτυχε.'));
      })
    );
  }

  deleteStay(stayId: string): Observable<void> {
    const trimmed = stayId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η καταχώρηση δεν βρέθηκε.'));
    }

    this.safeRequireUser();

    return this.http.delete<void>(`${this.baseUrl}/${trimmed}`).pipe(
      tap(() => {
        this.staysSubject.next(this.staysSubject.value.filter(stay => stay.id !== trimmed));
        this.mineStaysSubject.next(this.mineStaysSubject.value.filter(stay => stay.id !== trimmed));
      }),
      catchError(error => {
        console.error(`Failed to delete temporary stay ${trimmed}`, error);
        return throwError(() => this.toError(error, 'Η διαγραφή απέτυχε.'));
      })
    );
  }

  private toError(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message ?? error.error?.error;
      if (typeof backendMessage === 'string' && backendMessage.trim().length) {
        return new Error(backendMessage.trim());
      }
    }
    return error instanceof Error ? error : new Error(fallback);
  }

  hideStay(stayId: string): Observable<TemporaryStay> {
    const trimmed = stayId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η καταχώρηση δεν βρέθηκε.'));
    }

    this.safeRequireUser();

    return this.http.post<ApiTemporaryStay>(`${this.baseUrl}/${trimmed}/hide`, {}).pipe(
      map(api => this.mapStay(api)),
      tap(stay => {
        this.upsert(stay);
        this.upsertMine(stay);
      }),
      catchError(error => {
        console.error(`Failed to hide temporary stay ${trimmed}`, error);
        return throwError(() => error instanceof Error ? error : new Error('Η αλλαγή ορατότητας απέτυχε.'));
      })
    );
  }

  publishStay(stayId: string): Observable<TemporaryStay> {
    const trimmed = stayId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η καταχώρηση δεν βρέθηκε.'));
    }

    this.safeRequireUser();

    return this.http.post<ApiTemporaryStay>(`${this.baseUrl}/${trimmed}/publish`, {}).pipe(
      map(api => this.mapStay(api)),
      tap(stay => {
        this.upsert(stay);
        this.upsertMine(stay);
      }),
      catchError(error => {
        console.error(`Failed to publish temporary stay ${trimmed}`, error);
        return throwError(() => error instanceof Error ? error : new Error('Η αλλαγή ορατότητας απέτυχε.'));
      })
    );
  }

  private buildQueryParams(filters: TemporaryStayFilters): HttpParams {
    let params = new HttpParams().set('page', '0').set('size', '100');

    if (filters.type) {
      const code = STAY_TYPE_TO_API[filters.type];
      params = params.set('types', code);
    }

    if (typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice)) {
      params = params.set('maxPrice', String(filters.maxPrice));
    }

    if (filters.location) {
      params = params.set('city', filters.location);
    }

    if (filters.costCategory) {
      params = params.set('costCategory', COST_CATEGORY_TO_API[filters.costCategory]);
    }

    if (filters.purpose) {
      params = params.set('purpose', STAY_PURPOSE_TO_API[filters.purpose]);
    }

    return params;
  }

  private mapStay(api: ApiTemporaryStay): TemporaryStay {
    const type = STAY_TYPE_FROM_API[api.type] ?? 'Δωμάτιο';
    const costCategory = api.costCategory ? COST_CATEGORY_FROM_API[api.costCategory] : 'paid';
    const pricePerNight = costCategory === 'free' ? 0 : this.toNumber(api.pricePerNight, 0);
    const minNights = Math.max(1, Math.round(this.toNumber(api.minNights, 1)));
    const purpose: TemporaryStayPurpose = api.purpose ? STAY_PURPOSE_FROM_API[api.purpose] : 'accommodation';

    const location: TemporaryStay['location'] = {
      address: this.normalizeString(api.location?.address) || 'Μη διαθέσιμη διεύθυνση',
      city: this.normalizeString(api.location?.city) || 'Σάμος',
      postalCode: this.normalizeString(api.location?.postalCode) || ''
    };

    if (typeof api.location?.lat === 'number') {
      location.lat = api.location.lat;
    }

    if (typeof api.location?.lng === 'number') {
      location.lng = api.location.lng;
    }

    const contact = {
      name: this.normalizeString(api.contact?.name) || FALLBACK_CONTACT.name,
      phone: this.normalizeString(api.contact?.phone) || FALLBACK_CONTACT.phone,
      email: this.normalizeString(api.contact?.email) || FALLBACK_CONTACT.email,
      website: this.normalizeString(api.contact?.website) || undefined,
      instagram: this.normalizeString(api.contact?.instagram) || undefined,
      facebook: this.normalizeString(api.contact?.facebook) || undefined
    } satisfies TemporaryStay['contact'];

    const amenities = this.normalizeStringArray(api.amenities);
    const images = this.normalizeImages(api.images);
    const availability = this.mapAvailability(api.availability);

    return {
      id: api.id,
      title: this.normalizeString(api.title) || 'Προσωρινή διαμονή',
      description: api.description ?? '',
      type,
      pricePerNight,
      minNights,
      costCategory,
      location,
      amenities,
      images,
      contact,
      createdAt: this.normalizeIso(api.createdAt) ?? new Date().toISOString(),
      availability,
      purpose,
      linkedPropertyId: api.linkedPropertyId ?? undefined,
      published: api.published ?? true
    };
  }

  private mapAvailability(api?: ApiAvailability): AvailabilitySchedule | undefined {
    if (!api) {
      return undefined;
    }

    const unavailable = (api.unavailable ?? [])
      .map(window => this.mapAvailabilityWindow(window))
      .filter((window): window is AvailabilityWindow => !!window);

    if (!unavailable.length && !api.note && !api.calendarUrl && !api.lastUpdated) {
      return undefined;
    }

    return {
      unavailable,
      note: this.normalizeString(api.note) || undefined,
      calendarUrl: this.normalizeString(api.calendarUrl) || undefined,
      lastUpdated: this.normalizeIso(api.lastUpdated) ?? new Date().toISOString()
    };
  }

  private mapAvailabilityWindow(window: ApiAvailabilityWindow): AvailabilityWindow | null {
    const startDate = this.normalizeIso(window.startDate);
    if (!startDate) {
      return null;
    }

    const mapped: AvailabilityWindow = { startDate };

    const endDate = this.normalizeIso(window.endDate);
    if (endDate) {
      mapped.endDate = endDate;
    }

    const label = this.normalizeString(window.label);
    if (label) {
      mapped.label = label;
    }

    return mapped;
  }

  private buildCreateRequestPayload(payload: TemporaryStayPayload): CreateTemporaryStayRequestPayload {
    const normalized = this.buildNormalizedRequestPayload(payload);
    return {
      ...normalized,
      images: normalized.images.length ? normalized.images : [FALLBACK_IMAGE]
    };
  }

  private buildUpdateRequestPayload(payload: TemporaryStayPayload): UpdateTemporaryStayRequestPayload {
    return this.buildNormalizedRequestPayload(payload);
  }

  private buildNormalizedRequestPayload(payload: TemporaryStayPayload): CreateTemporaryStayRequestPayload {
    const title = this.normalizeString(payload.title);
    if (!title) {
      throw new Error('Συμπλήρωσε τίτλο για την καταχώρηση.');
    }

    const description = this.normalizeString(payload.description);
    if (!description) {
      throw new Error('Πρόσθεσε μια περιγραφή για την καταχώρηση.');
    }

    const type = STAY_TYPE_TO_API[payload.type];
    if (!type) {
      throw new Error('Επίλεξε διαθέσιμο τύπο διαμονής.');
    }

    const costCategory = COST_CATEGORY_TO_API[payload.costCategory];
    if (!costCategory) {
      throw new Error('Επίλεξε διαθέσιμη κατηγορία κόστους.');
    }

    const price = payload.costCategory === 'free' ? 0 : this.toNumber(payload.pricePerNight, Number.NaN);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Το κόστος διαμονής δεν είναι έγκυρο.');
    }

    const minNightsRaw = this.toNumber(payload.minNights, Number.NaN);
    if (!Number.isFinite(minNightsRaw) || minNightsRaw < 1) {
      throw new Error('Οι ελάχιστες νύχτες δεν είναι έγκυρες.');
    }
    const minNights = Math.max(1, Math.round(minNightsRaw));

    const location = payload.location
      ? {
          address: this.normalizeString(payload.location.address) || undefined,
          city: this.normalizeString(payload.location.city) || undefined,
          postalCode: this.normalizeString(payload.location.postalCode) || undefined,
          lat: typeof payload.location.lat === 'number' ? payload.location.lat : undefined,
          lng: typeof payload.location.lng === 'number' ? payload.location.lng : undefined
        }
      : undefined;

    const contact = payload.contact
      ? {
          name: this.normalizeString(payload.contact.name) || undefined,
          phone: this.normalizeString(payload.contact.phone) || undefined,
          email: this.normalizeString(payload.contact.email) || undefined,
          website: this.normalizeString(payload.contact.website) || undefined,
          instagram: this.normalizeString(payload.contact.instagram) || undefined,
          facebook: this.normalizeString(payload.contact.facebook) || undefined
        }
      : undefined;

    const availability = payload.availability
      ? this.buildAvailabilityRequest(payload.availability)
      : undefined;

    const purpose = payload.purpose ? STAY_PURPOSE_TO_API[payload.purpose] : STAY_PURPOSE_TO_API.accommodation;
    if (!purpose) {
      throw new Error('Επίλεξε σκοπό για την καταχώρηση.');
    }

    const linkedPropertyId = this.normalizeString(payload.linkedPropertyId);

    return {
      title,
      description,
      type,
      pricePerNight: price,
      minNights,
      costCategory,
      location,
      amenities: this.normalizeStringArray(payload.amenities),
      images: this.normalizeStringArray(payload.images),
      contact,
      availability,
      purpose,
      linkedPropertyId: linkedPropertyId ?? undefined
    };
  }

  private buildAvailabilityRequest(availability: NonNullable<TemporaryStayPayload['availability']>): ApiAvailabilityRequest | undefined {
    const unavailable = Array.isArray(availability.unavailable)
      ? availability.unavailable
          .map(window => this.buildAvailabilityWindowRequest(window))
          .filter((window): window is ApiAvailabilityWindowRequest => !!window)
      : undefined;

    if (!unavailable?.length && !availability.note && !availability.calendarUrl) {
      return undefined;
    }

    const request: ApiAvailabilityRequest = {};

    if (unavailable?.length) {
      request.unavailable = unavailable;
    }

    const note = this.normalizeString(availability.note);
    if (note) {
      request.note = note;
    }

    const calendarUrl = this.normalizeString(availability.calendarUrl);
    if (calendarUrl) {
      request.calendarUrl = calendarUrl;
    }

    return request;
  }

  private buildAvailabilityWindowRequest(window: { startDate: string; endDate?: string; label?: string }): ApiAvailabilityWindowRequest | null {
    const startDate = this.normalizeIso(window.startDate);
    if (!startDate) {
      return null;
    }

    const request: ApiAvailabilityWindowRequest = { startDate };

    const endDate = this.normalizeIso(window.endDate);
    if (endDate) {
      request.endDate = endDate;
    }

    const label = this.normalizeString(window.label);
    if (label) {
      request.label = label;
    }

    return request;
  }

  private normalizeImages(images?: string[]): string[] {
    if (!Array.isArray(images) || !images.length) {
      return [FALLBACK_IMAGE];
    }

    const normalized = images
      .map(image => (typeof image === 'string' ? image.trim() : ''))
      .filter(image => image.length > 0);

    return normalized.length ? normalized : [FALLBACK_IMAGE];
  }

  private normalizeStringArray(values?: string[]): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return Array.from(
      new Set(
        values
          .map(value => this.normalizeString(value))
          .filter((value): value is string => value.length > 0)
      )
    );
  }

  private normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeIso(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    return undefined;
  }

  private toNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private sortByRecency(stays: TemporaryStay[]): TemporaryStay[] {
    return [...stays].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }

  private upsert(stay: TemporaryStay): void {
    const others = this.staysSubject.value.filter(item => item.id !== stay.id);
    this.staysSubject.next(this.sortByRecency([...others, stay]));
  }

  private upsertMine(stay: TemporaryStay): void {
    const existing = this.mineStaysSubject.value;
    const index = existing.findIndex(item => item.id === stay.id);
    if (index >= 0) {
      const updated = [...existing];
      updated[index] = stay;
      this.mineStaysSubject.next(this.sortByRecency(updated));
      return;
    }
    this.mineStaysSubject.next(this.sortByRecency([...existing, stay]));
  }

  private safeRequireUser(): User {
    try {
      return this.authService.requireUser();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Απαιτείται σύνδεση για αυτή την ενέργεια.');
    }
  }
}
