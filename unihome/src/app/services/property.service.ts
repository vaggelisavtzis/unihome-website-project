import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilitySchedule, AvailabilityWindow } from '../models/availability.model';
import { Property, PropertyLocation } from '../models/property.model';
import { AuthService } from './auth.service';
import { isOwnerUser } from '../models/user.model';
import { TemporaryService } from './temporary.service';
import { matchesSearchNeedle } from '../shared/utils/search-normalizer';

export interface PropertyFilters {
  type?: string;
  maxPrice?: number | null;
  location?: string;
  minRooms?: number | null;
  searchQuery?: string;
  furnished?: boolean;
  hasDamage?: boolean;
}

export interface PropertyPayload {
  title: string;
  type: string;
  price: number;
  area: number;
  rooms: number;
  address: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
  description: string;
  features: string[];
  images: string[];
  isFurnished: boolean;
  hasDamage: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactInstagram?: string;
  contactFacebook?: string;
  availability?: { unavailable?: AvailabilityWindow[]; note?: string };
  hospitality?: boolean;
}

interface ApiPagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
}

interface ApiPropertyResponse {
  id: string;
  title: string;
  description?: string;
  type: string;
  price?: number | string;
  area?: number;
  rooms?: number;
  features?: string[];
  images?: string[];
  basics?: ApiPropertyBasics;
  location?: ApiPropertyLocation;
  contact?: ApiPropertyContact;
  availability?: ApiAvailability;
  ownerId: string;
  ownerName?: string;
  createdAt?: string;
  hospitality?: boolean;
  hospitalityListingId?: string;
  published?: boolean;
}

interface ApiPropertyBasics {
  furnished?: boolean;
  hasDamage?: boolean;
}

interface ApiPropertyLocation {
  address?: string;
  city?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

interface ApiPropertyContact {
  name?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
}

interface ApiAvailability {
  unavailable?: ApiAvailabilityWindow[];
  note?: string;
  lastUpdated?: string;
  calendarUrl?: string;
}

interface ApiAvailabilityWindow {
  startDate?: string;
  endDate?: string;
  label?: string;
}

interface CreatePropertyRequestPayload {
  title: string;
  description: string;
  type: keyof typeof PROPERTY_TYPE_LABELS;
  price: number;
  area: number;
  rooms: number;
  features: string[];
  images: string[];
  basics: {
    furnished?: boolean;
    hasDamage?: boolean;
  };
  location?: {
    address?: string;
    city?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  availability?: ApiAvailability;
  hospitality: boolean;
}

interface UpdatePropertyRequestPayload extends CreatePropertyRequestPayload {}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Διαμέρισμα',
  STUDIO: 'Γκαρσονιέρα',
  HOUSE: 'Σπίτι',
  ROOMMATE: 'Συγκάτοικος',
  SALE: 'Πώληση'
};

const PROPERTY_TYPE_REVERSE: Record<string, keyof typeof PROPERTY_TYPE_LABELS> = {
  Διαμέρισμα: 'APARTMENT',
  Γκαρσονιέρα: 'STUDIO',
  Σπίτι: 'HOUSE',
  Συγκάτοικος: 'ROOMMATE',
  Πώληση: 'SALE'
};

const FALLBACK_CONTACT = {
  name: 'Ομάδα Unihome',
  phone: '2101234567',
  email: 'info@unihome.gr'
};

const FALLBACK_IMAGES: string[] = [];

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly baseUrl = `${environment.apiUrl}/properties`;
  private readonly propertiesSubject = new BehaviorSubject<Property[]>([]);
  readonly properties$ = this.propertiesSubject.asObservable();

  private publicProperties: Property[] = [];
  private ownerProperties: Property[] = [];

  private isLoaded = false;
  private pendingFetch = new Set<string>();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly temporaryService: TemporaryService
  ) {
    this.refresh();

    this.authService.currentUser$.subscribe(user => {
      if (!isOwnerUser(user)) {
        this.ownerProperties = [];
        this.emitCombinedSnapshot();
        return;
      }
      this.loadOwnerProperties().subscribe();
    });
  }

  ensureLoaded(): void {
    if (!this.isLoaded) {
      this.refresh();
    }
  }

  refresh(filters: PropertyFilters = {}): void {
    this.isLoaded = false;
    this.fetchProperties(filters).subscribe({
      error: () => {
        
      }
    });
    this.syncOwnerProperties();
  }

  fetchProperties(filters: PropertyFilters = {}): Observable<Property[]> {
    const params = this.buildQueryParams(filters);
    return this.http
      .get<ApiPagedResponse<ApiPropertyResponse>>(this.baseUrl, { params })
      .pipe(
        map(response => response.items.map(item => this.mapProperty(item))),
        tap(properties => {
          this.publicProperties = properties;
          this.emitCombinedSnapshot();
          this.isLoaded = true;
        }),
        catchError(error => {
          console.error('Failed to fetch properties', error);
          throw error;
        })
      );
  }

  private emitCombinedSnapshot(): void {
    const merged = new Map<string, Property>();
    for (const property of this.publicProperties) {
      merged.set(property.id, property);
    }
    for (const property of this.ownerProperties) {
      merged.set(property.id, property);
    }
    this.propertiesSubject.next(Array.from(merged.values()));
  }

  private syncOwnerProperties(): void {
    const user = this.authService.currentUserSnapshot();
    if (!isOwnerUser(user)) {
      this.ownerProperties = [];
      this.emitCombinedSnapshot();
      return;
    }
    this.loadOwnerProperties().subscribe({
      error: () => {
        
      }
    });
  }

  private loadOwnerProperties(): Observable<Property[]> {
    const user = this.authService.currentUserSnapshot();
    if (!isOwnerUser(user)) {
      this.ownerProperties = [];
      this.emitCombinedSnapshot();
      return of([]);
    }

    return this.http.get<ApiPropertyResponse[]>(`${this.baseUrl}/mine`).pipe(
      map(items => items.map(item => this.mapProperty(item))),
      tap(properties => {
        this.ownerProperties = properties;
        this.emitCombinedSnapshot();
      }),
      catchError(error => {
        console.error('Failed to fetch owner properties', error);
        return of([]);
      })
    );
  }

  private upsertProperty(property: Property): void {
    const isPublished = property.published !== false;
    if (isPublished) {
      this.publicProperties = this.mergePropertyList(this.publicProperties, property);
    } else {
      this.publicProperties = this.publicProperties.filter(item => item.id !== property.id);
    }

    const currentUser = this.authService.currentUserSnapshot();
    if (isOwnerUser(currentUser) && currentUser.id === property.ownerId) {
      this.ownerProperties = this.mergePropertyList(this.ownerProperties, property);
    } else if (this.ownerProperties.some(item => item.id === property.id)) {
      this.ownerProperties = this.mergePropertyList(this.ownerProperties, property);
    }

    this.emitCombinedSnapshot();
  }

  private mergePropertyList(source: Property[], property: Property): Property[] {
    const index = source.findIndex(item => item.id === property.id);
    if (index === -1) {
      return [...source, property];
    }
    const clone = [...source];
    clone[index] = property;
    return clone;
  }

  getSnapshot(): Property[] {
    return this.propertiesSubject.value;
  }

  filterProperties(filters: PropertyFilters): Property[] {
    return this.applyLocalFilters(this.propertiesSubject.value, filters);
  }

  getPropertyById(id: string): Property | undefined {
    const existing = this.propertiesSubject.value.find(property => property.id === id);
    if (existing) {
      return existing;
    }

    if (this.pendingFetch.has(id)) {
      return undefined;
    }

    this.pendingFetch.add(id);
    this.http
      .get<ApiPropertyResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => this.mapProperty(response)),
        tap(property => {
          const without = this.propertiesSubject.value.filter(item => item.id !== property.id);
          this.propertiesSubject.next([...without, property]);
        }),
        catchError(error => {
          console.error(`Failed to load property ${id}`, error);
          return of<Property | null>(null);
        }),
        finalize(() => this.pendingFetch.delete(id))
      )
      .subscribe();

    return undefined;
  }

  deleteProperty(propertyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${propertyId}`).pipe(
      tap(() => {
        this.publicProperties = this.publicProperties.filter(property => property.id !== propertyId);
        this.ownerProperties = this.ownerProperties.filter(property => property.id !== propertyId);
        this.emitCombinedSnapshot();
        this.authService.removeFavoriteLocally(propertyId);
      })
    );
  }

  hideProperty(propertyId: string): Observable<Property> {
    return this.http.post<ApiPropertyResponse>(`${this.baseUrl}/${propertyId}/hide`, {}).pipe(
      map(response => this.mapProperty(response)),
      tap(property => this.upsertProperty(property))
    );
  }

  publishProperty(propertyId: string): Observable<Property> {
    return this.http.post<ApiPropertyResponse>(`${this.baseUrl}/${propertyId}/publish`, {}).pipe(
      map(response => this.mapProperty(response)),
      tap(property => this.upsertProperty(property))
    );
  }

  createProperty(payload: PropertyPayload): Observable<Property> {
    const request = this.buildCreateRequestPayload(payload);
    return this.http.post<ApiPropertyResponse>(this.baseUrl, request).pipe(
      map(response => this.mapProperty(response)),
      tap(property => {
        this.upsertProperty(property);
        if (property.hospitality && property.hospitalityListingId) {
          this.temporaryService.ensureStayLoaded(property.hospitalityListingId);
        }
      }),
      catchError(error => {
        console.error('Failed to create property', error);
        return throwError(() => this.toError(error, 'Η δημιουργία του ακινήτου απέτυχε.'));
      })
    );
  }

  updateProperty(propertyId: string, payload: PropertyPayload): Observable<Property> {
    const trimmedId = propertyId?.trim();
    if (!trimmedId) {
      return throwError(() => new Error('Μη έγκυρο ακίνητο.'));
    }

    const request = this.buildUpdateRequestPayload(payload);
    return this.http.put<ApiPropertyResponse>(`${this.baseUrl}/${trimmedId}`, request).pipe(
      map(response => this.mapProperty(response)),
      tap(property => this.upsertProperty(property)),
      catchError(error => {
        console.error(`Failed to update property ${trimmedId}`, error);
        return throwError(() => this.toError(error, 'Η ενημέρωση του ακινήτου απέτυχε.'));
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

  toggleFavorite(propertyId: string): Observable<{ success: boolean; favorite: boolean; message?: string }> {
    const trimmedId = typeof propertyId === 'string' ? propertyId.trim() : '';
    if (!trimmedId.length) {
      return of({
        success: false,
        favorite: false,
        message: 'Μη έγκυρο ακίνητο.'
      });
    }

    return this.authService.togglePropertyFavorite(trimmedId);
  }

  getFavoriteProperties(): Property[] {
    const user = this.authService.currentUserSnapshot();
    if (!user) {
      return [];
    }

    const favorites = new Set(user.favorites);
    return this.propertiesSubject.value.filter(
      property => property.published !== false && favorites.has(property.id)
    );
  }

  private buildQueryParams(filters: PropertyFilters): HttpParams {
    let params = new HttpParams();
    if (filters.type) {
      const apiType = PROPERTY_TYPE_REVERSE[filters.type] ?? filters.type;
      params = params.set('types', apiType);
    }
    if (typeof filters.maxPrice === 'number') {
      params = params.set('maxPrice', String(filters.maxPrice));
    }
    if (filters.location) {
      params = params.set('city', filters.location);
    }
    if (typeof filters.minRooms === 'number') {
      params = params.set('minRooms', String(filters.minRooms));
    }
    if (filters.searchQuery) {
      params = params.set('search', filters.searchQuery);
    }
    if (typeof filters.furnished === 'boolean') {
      params = params.set('furnished', String(filters.furnished));
    }
    if (typeof filters.hasDamage === 'boolean') {
      params = params.set('hasDamage', String(filters.hasDamage));
    }
    params = params.set('page', '0').set('size', '100');
    return params;
  }

  private mapProperty(api: ApiPropertyResponse): Property {
    const typeLabel = PROPERTY_TYPE_LABELS[api.type] ?? api.type;
    const price = this.toNumber(api.price);
    const area = this.toNumber(api.area, 0);
    const rooms = this.toNumber(api.rooms, 1);

    const basics = {
      furnished: api.basics?.furnished ?? false,
      hasDamage: api.basics?.hasDamage ?? false
    } as Property['basics'];

    const location: PropertyLocation = {
      address: api.location?.address?.trim() || '—',
      city: api.location?.city?.trim() || 'Άγνωστη περιοχή',
      postalCode: api.location?.postalCode?.trim() || ''
    };
    const lat = this.toOptionalNumber(api.location?.lat);
    const lng = this.toOptionalNumber(api.location?.lng);
    if (lat !== null) {
      location.lat = lat;
    }
    if (lng !== null) {
      location.lng = lng;
    }

    const contact = {
      name: api.contact?.name?.trim() || api.ownerName?.trim() || FALLBACK_CONTACT.name,
      phone: api.contact?.phone?.trim() || FALLBACK_CONTACT.phone,
      email: api.contact?.email?.trim() || FALLBACK_CONTACT.email,
      instagram: api.contact?.instagram?.trim() || undefined,
      facebook: api.contact?.facebook?.trim() || undefined
    };

    const availability = this.mapAvailability(api.availability);

    return {
      id: api.id,
      title: api.title,
      description: api.description ?? '',
      type: typeLabel as Property['type'],
      price,
      area,
      rooms,
      features: Array.isArray(api.features) ? api.features.filter(Boolean) : [],
      images: this.pickImages(api.images),
      basics,
      location,
      ownerId: api.ownerId,
      contact,
      createdAt: this.normalizeIso(api.createdAt) ?? new Date().toISOString(),
      availability,
      hospitality: Boolean(api.hospitality),
      hospitalityListingId: api.hospitalityListingId ?? undefined,
      published: api.published !== false
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
      note: api.note?.trim() || undefined,
      calendarUrl: api.calendarUrl?.trim() || undefined,
      lastUpdated: this.normalizeIso(api.lastUpdated) ?? new Date().toISOString()
    };
  }

  private mapAvailabilityWindow(window: ApiAvailabilityWindow): AvailabilityWindow | null {
    const startDate = this.normalizeIso(window.startDate);
    if (!startDate) {
      return null;
    }

    const availabilityWindow: AvailabilityWindow = { startDate };
    const endDate = this.normalizeIso(window.endDate);
    if (endDate) {
      availabilityWindow.endDate = endDate;
    }
    const label = window.label?.trim();
    if (label) {
      availabilityWindow.label = label;
    }
    return availabilityWindow;
  }

  private pickImages(images?: string[]): string[] {
    if (!Array.isArray(images) || !images.length) {
      return [];
    }
    const normalized = images
      .map(image => (typeof image === 'string' ? image.trim() : ''))
      .filter(image => image.length > 0);
    return normalized.length ? normalized : [];
  }

  private buildCreateRequestPayload(payload: PropertyPayload): CreatePropertyRequestPayload {
    const base = this.buildNormalizedRequestPayload(payload);
    return {
      ...base,
      images: [...base.images]
    };
  }

  private buildUpdateRequestPayload(payload: PropertyPayload): UpdatePropertyRequestPayload {
    const base = this.buildNormalizedRequestPayload(payload);
    return {
      ...base,
      images: [...base.images]
    };
  }

  private buildNormalizedRequestPayload(payload: PropertyPayload): CreatePropertyRequestPayload {
    const typeKey = PROPERTY_TYPE_REVERSE[payload.type] ?? 'APARTMENT';
    const trim = (value?: string): string | undefined => {
      if (typeof value !== 'string') {
        return undefined;
      }
      const cleaned = value.trim();
      return cleaned.length ? cleaned : undefined;
    };
    const features = Array.isArray(payload.features)
      ? payload.features.map(feature => feature.trim()).filter(Boolean)
      : [];
    const images = Array.isArray(payload.images)
      ? payload.images.map(image => image.trim()).filter(Boolean)
      : [];

    const location = payload.address || payload.city || payload.postalCode || typeof payload.lat === 'number' || typeof payload.lng === 'number'
      ? {
          address: trim(payload.address),
          city: trim(payload.city),
          postalCode: trim(payload.postalCode),
          lat: typeof payload.lat === 'number' ? payload.lat : undefined,
          lng: typeof payload.lng === 'number' ? payload.lng : undefined
        }
      : undefined;

    const contact = payload.contactName || payload.contactPhone || payload.contactEmail || payload.contactInstagram || payload.contactFacebook
      ? {
          name: trim(payload.contactName),
          phone: trim(payload.contactPhone),
          email: trim(payload.contactEmail),
          instagram: trim(payload.contactInstagram),
          facebook: trim(payload.contactFacebook)
        }
      : undefined;

    const serialized: CreatePropertyRequestPayload = {
      title: trim(payload.title) ?? '',
      description: trim(payload.description) ?? '',
      type: typeKey,
      price: Math.max(0, Number(payload.price) || 0),
      area: Math.max(0, Number(payload.area) || 0),
      rooms: Math.max(1, Math.round(Number(payload.rooms) || 1)),
      features,
      images,
      basics: {
        furnished: payload.isFurnished,
        hasDamage: payload.hasDamage
      },
      location,
      contact,
      availability: this.toApiAvailability(payload.availability),
      hospitality: !!payload.hospitality
    };

    return serialized;
  }

  private toApiAvailability(availability?: { unavailable?: AvailabilityWindow[]; note?: string }): ApiAvailability | undefined {
    if (!availability) {
      return undefined;
    }

    const note = availability.note?.trim();
    const windows = (availability.unavailable ?? [])
      .map(window => ({
        startDate: window.startDate,
        endDate: window.endDate,
        label: window.label
      }))
      .filter(window => !!window.startDate);

    if (!windows.length && !note) {
      return undefined;
    }

    return {
      unavailable: windows,
      note
    };
  }

  private applyLocalFilters(properties: Property[], filters: PropertyFilters): Property[] {
    const {
      type,
      maxPrice,
      location,
      minRooms,
      searchQuery,
      furnished,
      hasDamage
    } = filters;

    return properties.filter(property => {
      if (property.published === false) {
        return false;
      }
      if (type && property.type !== type) {
        return false;
      }
      if (typeof maxPrice === 'number' && property.price > maxPrice) {
        return false;
      }
      if (typeof minRooms === 'number' && property.rooms < minRooms) {
        return false;
      }
      if (
        location &&
        !matchesSearchNeedle(
          [property.location.city, property.location.address, property.location.postalCode],
          location
        )
      ) {
        return false;
      }
      if (
        searchQuery &&
        !matchesSearchNeedle(
          [
            property.title,
            property.description,
            property.location.city,
            property.location.address,
            property.location.postalCode
          ],
          searchQuery
        )
      ) {
        return false;
      }
      if (typeof furnished === 'boolean' && property.basics.furnished !== furnished) {
        return false;
      }
      if (typeof hasDamage === 'boolean' && property.basics.hasDamage !== hasDamage) {
        return false;
      }
      return true;
    });
  }

  private toNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  private toOptionalNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private normalizeIso(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed.toISOString();
  }
}
