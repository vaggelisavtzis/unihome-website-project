import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilitySchedule, AvailabilityWindow } from '../models/availability.model';
import { RoommateAd, RoommateAdMode, RoommateRating } from '../models/roommate.model';
import { AuthService } from './auth.service';
import { StudentUser, User } from '../models/user.model';
import { matchesSearchNeedle } from '../shared/utils/search-normalizer';

interface ApiPagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
}

interface ApiRoommateAd {
  id: string;
  title: string;
  description?: string;
  monthlyRent?: number | string;
  propertyLocation?: string;
  mode?: string;
  availableFrom?: string;
  createdAt?: string;
  published?: boolean;
  authorId: string;
  authorName?: string;
  preferences?: string[];
  propertyFeatures?: string[];
  lifestyle?: string[];
  images?: string[];
  amenities?: string[];
  profile?: ApiRoommateProfile;
  location?: ApiRoommateLocation;
  contact?: ApiRoommateContact;
  availability?: ApiAvailability;
  ratings?: ApiRoommateRating[];
  ratingCount?: number;
  averageRating?: number;
  lastRatedAt?: string;
}

interface ApiRoommateProfile {
  name?: string;
  age?: number | string;
  gender?: string;
  university?: string;
  department?: string;
  semester?: string;
  bio?: string;
  avatar?: string;
  student?: boolean;
  interests?: string[];
  habits?: string[];
}

interface ApiRoommateLocation {
  city?: string;
  area?: string;
  proximity?: string;
}

interface ApiRoommateContact {
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

interface ApiRoommateRating {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  score?: number | string;
  comment?: string;
  createdAt?: string;
}

interface CreateRoommateAdRequestPayload {
  title: string;
  description: string;
  monthlyRent: number;
  propertyLocation?: string;
  mode: RoommateAdMode;
  availableFrom?: string;
  preferences: string[];
  propertyFeatures: string[];
  lifestyle: string[];
  images: string[];
  amenities: string[];
  profile?: ApiRoommateProfile;
  location?: ApiRoommateLocation;
  contact?: ApiRoommateContact;
  availability?: ApiAvailability;
}

interface UpdateRoommateAdRequestPayload extends CreateRoommateAdRequestPayload {}

interface SubmitRoommateRatingPayload {
  score: number;
  reviewerName: string;
  comment?: string;
}

const FALLBACK_CONTACT = {
  name: 'Ομάδα Unihome',
  phone: '2101234567',
  email: 'info@unihome.gr'
};

export interface RoommateFilters {
  searchQuery?: string;
  university?: string;
  lifestyle?: string;
  location?: string;
  mode?: RoommateAdMode;
  maxRent?: number | null;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  minRating?: number | null;
  studentOnly?: boolean;
}

export interface RoommateAdPayload {
  title: string;
  description: string;
  monthlyRent: number;
  mode: RoommateAdMode;
  availableFrom?: string;
  propertyLocation?: string;
  preferences?: string[];
  propertyFeatures?: string[];
  lifestyle?: string[];
  amenities?: string[];
  images?: string[];
  profile?: {
    name?: string;
    age?: number;
    gender?: string;
    university?: string;
    department?: string;
    semester?: string;
    bio?: string;
    avatar?: string;
    interests?: string[];
    habits?: string[];
    isStudent?: boolean;
  };
  location?: {
    city?: string;
    area?: string;
    proximity?: string;
  };
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
  };
  availability?: AvailabilitySchedule;
}

@Injectable({ providedIn: 'root' })
export class RoommateService {
  private readonly baseUrl = `${environment.apiUrl}/roommates`;
  private readonly roommateAdsSubject = new BehaviorSubject<RoommateAd[]>([]);
  readonly roommateAds$ = this.roommateAdsSubject.asObservable();

  private readonly mineRoommateAdsSubject = new BehaviorSubject<RoommateAd[]>([]);
  readonly mineRoommateAds$ = this.mineRoommateAdsSubject.asObservable();

  private isLoaded = false;
  private isLoading = false;
  private pendingFetch = new Set<string>();

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

  refresh(filters: RoommateFilters = {}): void {
    this.isLoading = true;
    this.fetchRoommateAds(filters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        error: () => {
          
        }
      });
  }

  fetchRoommateAds(filters: RoommateFilters = {}): Observable<RoommateAd[]> {
    const params = this.buildQueryParams(filters);
    return this.http
      .get<ApiPagedResponse<ApiRoommateAd>>(this.baseUrl, { params })
      .pipe(
        map(response => response.items.map(item => this.mapRoommate(item))),
        tap(ads => {
          this.roommateAdsSubject.next(this.sortByRecency(ads));
          this.isLoaded = true;
        }),
        catchError(error => {
          console.error('Failed to fetch roommate ads', error);
          return throwError(() => error);
        })
      );
  }

  fetchMineAds(): Observable<RoommateAd[]> {
    let currentUser: User;
    try {
      currentUser = this.safeRequireUser();
    } catch (error) {
      this.mineRoommateAdsSubject.next([]);
      return of([]);
    }

    return this.http
      .get<ApiRoommateAd[]>(`${this.baseUrl}/mine`)
      .pipe(
        map(items => items.map(item => this.mapRoommate(item))),
        tap(ads => {
          const mine = ads.filter(ad => ad.authorId === currentUser.id);
          this.mineRoommateAdsSubject.next(this.sortByRecency(mine));
        }),
        catchError(error => {
          console.error('Failed to fetch mine roommate ads', error);
          return throwError(() => error);
        })
      );
  }

  refreshMine(): void {
    this.fetchMineAds().subscribe({
      error: () => {
        
      }
    });
  }

  getAds(): RoommateAd[] {
    return this.roommateAdsSubject.value;
  }

  getMineAds(): RoommateAd[] {
    return this.mineRoommateAdsSubject.value;
  }

  getDistinctUniversities(): string[] {
    const set = new Set<string>();
    for (const ad of this.roommateAdsSubject.value) {
      const university = ad.profile?.university?.trim();
      if (university) {
        set.add(university);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'el', { sensitivity: 'base' }));
  }

  filterAds(filters: RoommateFilters): RoommateAd[] {
    return this.applyLocalFilters(this.roommateAdsSubject.value, filters);
  }

  ensureAdLoaded(adId: string): void {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return;
    }

    if (this.roommateAdsSubject.value.some(ad => ad.id === trimmed)) {
      return;
    }

    if (this.pendingFetch.has(trimmed)) {
      return;
    }

    this.pendingFetch.add(trimmed);

    this.http
      .get<ApiRoommateAd>(`${this.baseUrl}/${trimmed}`)
      .pipe(
        map(response => this.mapRoommate(response)),
        tap(ad => this.upsertAd(ad)),
        catchError(error => {
          console.error(`Failed to fetch roommate ad ${trimmed}`, error);
          return of<RoommateAd | null>(null);
        }),
        finalize(() => this.pendingFetch.delete(trimmed))
      )
      .subscribe();
  }

  getAdById(adId: string): RoommateAd | undefined {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return undefined;
    }

    const existing = this.roommateAdsSubject.value.find(ad => ad.id === trimmed);
    if (existing) {
      return existing;
    }

    this.ensureAdLoaded(trimmed);
    return undefined;
  }

  createAd(payload: RoommateAdPayload): Observable<RoommateAd> {
    let studentProfile: StudentUser;
    try {
      studentProfile = this.authService.requireStudent();
    } catch (error) {
      return throwError(() => (error instanceof Error ? error : new Error('Απαιτείται προφίλ μέλους.')));
    }

    const request = this.buildCreateRequestPayload(payload, studentProfile);

    return this.http.post<ApiRoommateAd>(this.baseUrl, request).pipe(
      map(response => this.mapRoommate(response)),
      tap(ad => {
        this.upsertAd(ad);
        this.upsertMineAd(ad);
      }),
      catchError(error => {
        console.error('Failed to create roommate ad', error);
        return throwError(() => this.toError(error, 'Η δημιουργία της αγγελίας απέτυχε.'));
      })
    );
  }

  updateAd(adId: string, payload: RoommateAdPayload): Observable<RoommateAd> {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η αγγελία δεν βρέθηκε.'));
    }

    let studentProfile: StudentUser;
    try {
      studentProfile = this.authService.requireStudent();
    } catch (error) {
      return throwError(() => (error instanceof Error ? error : new Error('Απαιτείται προφίλ μέλους.')));
    }

    const request = this.buildUpdateRequestPayload(payload, studentProfile);

    return this.http.put<ApiRoommateAd>(`${this.baseUrl}/${trimmed}`, request).pipe(
      map(response => this.mapRoommate(response)),
      tap(ad => {
        this.upsertAd(ad);
        this.upsertMineAd(ad);
      }),
      catchError(error => {
        console.error(`Failed to update roommate ad ${trimmed}`, error);
        return throwError(() => this.toError(error, 'Η ενημέρωση απέτυχε.'));
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

  rateAd(adId: string, score: number, comment?: string): Observable<RoommateAd> {
    let reviewer: User;
    try {
      reviewer = this.safeRequireUser();
    } catch (error) {
      return throwError(() => (error instanceof Error ? error : new Error('Απαιτείται σύνδεση για αυτή την ενέργεια.')));
    }
    const normalizedScore = Math.round(score);
    if (normalizedScore < 1 || normalizedScore > 5) {
      return throwError(() => new Error('Η βαθμολογία πρέπει να είναι από 1 έως 5.'));
    }

    const payload: SubmitRoommateRatingPayload = {
      score: normalizedScore,
      reviewerName: this.composeReviewerName(reviewer),
      comment: comment?.trim() || undefined
    };

    return this.http.post<ApiRoommateAd>(`${this.baseUrl}/${adId}/ratings`, payload).pipe(
      map(response => this.mapRoommate(response)),
      tap(ad => this.upsertAd(ad)),
      catchError(error => {
        console.error(`Failed to submit rating for roommate ad ${adId}`, error);
        return throwError(() => error);
      })
    );
  }

  removeAd(adId: string): Observable<void> {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η αγγελία δεν βρέθηκε.'));
    }

    let currentUser: User;
    try {
      currentUser = this.safeRequireUser();
    } catch (error) {
      return throwError(() => (error instanceof Error ? error : new Error('Απαιτείται σύνδεση για αυτή την ενέργεια.')));
    }
    const target = this.roommateAdsSubject.value.find(ad => ad.id === trimmed);
    if (target && target.authorId !== currentUser.id) {
      return throwError(() => new Error('Δεν έχεις δικαίωμα διαγραφής αυτής της αγγελίας.'));
    }

    return this.http.delete<void>(`${this.baseUrl}/${trimmed}`).pipe(
      tap(() => {
        this.roommateAdsSubject.next(
          this.roommateAdsSubject.value.filter(ad => ad.id !== trimmed)
        );
        this.mineRoommateAdsSubject.next(
          this.mineRoommateAdsSubject.value.filter(ad => ad.id !== trimmed)
        );
      }),
      catchError(error => {
        console.error(`Failed to delete roommate ad ${trimmed}`, error);
        return throwError(() => error);
      })
    );
  }

  hideAd(adId: string): Observable<RoommateAd> {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η αγγελία δεν βρέθηκε.'));
    }

    return this.http.post<ApiRoommateAd>(`${this.baseUrl}/${trimmed}/hide`, {}).pipe(
      map(response => this.mapRoommate(response)),
      tap(ad => {
        this.upsertAd(ad);
        this.upsertMineAd(ad);
      }),
      catchError(error => {
        console.error(`Failed to hide roommate ad ${trimmed}`, error);
        return throwError(() => error);
      })
    );
  }

  publishAd(adId: string): Observable<RoommateAd> {
    const trimmed = adId?.trim();
    if (!trimmed) {
      return throwError(() => new Error('Η αγγελία δεν βρέθηκε.'));
    }

    return this.http.post<ApiRoommateAd>(`${this.baseUrl}/${trimmed}/publish`, {}).pipe(
      map(response => this.mapRoommate(response)),
      tap(ad => {
        this.upsertAd(ad);
        this.upsertMineAd(ad);
      }),
      catchError(error => {
        console.error(`Failed to publish roommate ad ${trimmed}`, error);
        return throwError(() => error);
      })
    );
  }

  private buildQueryParams(filters: RoommateFilters): HttpParams {
    let params = new HttpParams().set('page', '0').set('size', '100');

    if (typeof filters.maxRent === 'number' && Number.isFinite(filters.maxRent)) {
      params = params.set('maxRent', String(filters.maxRent));
    }

    if (filters.location) {
      params = params.set('city', filters.location);
    }

    if (typeof filters.studentOnly === 'boolean') {
      params = params.set('studentOnly', String(filters.studentOnly));
    }

    return params;
  }

  private buildCreateRequestPayload(payload: RoommateAdPayload, student: StudentUser): CreateRoommateAdRequestPayload {
    return this.buildNormalizedRequestPayload(payload, student);
  }

  private buildUpdateRequestPayload(payload: RoommateAdPayload, student: StudentUser): UpdateRoommateAdRequestPayload {
    return this.buildNormalizedRequestPayload(payload, student);
  }

  private buildNormalizedRequestPayload(payload: RoommateAdPayload, student: StudentUser): CreateRoommateAdRequestPayload {
    const preferences = this.normalizeStringArray(payload.preferences);
    const propertyFeatures = this.normalizeStringArray(payload.propertyFeatures);
    const lifestyle = this.normalizeStringArray(payload.lifestyle);
    const amenities = this.normalizeStringArray(payload.amenities);
    const images = this.normalizeStringArray(payload.images);

    const profile: ApiRoommateProfile | undefined = payload.profile
      ? {
          name: this.normalizeString(payload.profile.name) || this.composeFullName(student),
          age: payload.profile.age,
          gender: this.normalizeString(payload.profile.gender),
          university: this.normalizeString(payload.profile.university) || student.profile.university,
          department: this.normalizeString(payload.profile.department) || student.profile.department,
          semester: this.normalizeString(payload.profile.semester),
          bio: this.normalizeString(payload.profile.bio),
          avatar: this.normalizeString(payload.profile.avatar),
          student: payload.profile.isStudent ?? true,
          interests: this.normalizeStringArray(payload.profile.interests),
          habits: this.normalizeStringArray(payload.profile.habits)
        }
      : {
          name: this.composeFullName(student),
          university: student.profile.university,
          department: student.profile.department,
          student: true
        };

    const location = payload.location
      ? {
          city: this.normalizeString(payload.location.city) || payload.propertyLocation || 'Σάμος',
          area: this.normalizeString(payload.location.area),
          proximity: this.normalizeString(payload.location.proximity)
        }
      : {
          city: payload.propertyLocation || 'Σάμος'
        };

    const contact: ApiRoommateContact = {
      name:
        this.normalizeString(payload.contact?.name) || profile?.name || this.composeFullName(student),
      phone:
        this.normalizeString(payload.contact?.phone) || this.normalizeString(student.phone) || FALLBACK_CONTACT.phone,
      email:
        this.normalizeString(payload.contact?.email) || this.normalizeString(student.email) || FALLBACK_CONTACT.email,
      instagram: this.normalizeString(payload.contact?.instagram) || undefined,
      facebook: this.normalizeString(payload.contact?.facebook) || undefined
    };

    const availability = payload.availability
      ? this.mapAvailabilityToRequest(payload.availability)
      : undefined;

    return {
      title: this.normalizeString(payload.title) || `Μέλος Unihome αναζητά συγκάτοικο`,
      description: this.normalizeString(payload.description) || 'Περιγραφή δεν δόθηκε.',
      monthlyRent: Number.isFinite(payload.monthlyRent) ? payload.monthlyRent : 0,
      propertyLocation:
        this.normalizeString(payload.propertyLocation) || location.city || student.profile.university,
      mode: (payload.mode ?? 'HOST_SEEKING_ROOMMATE') as RoommateAdMode,
      availableFrom: this.extractLocalDate(payload.availableFrom),
      preferences,
      propertyFeatures,
      lifestyle,
      images,
      amenities,
      profile,
      location,
      contact,
      availability
    };
  }

  private mapRoommate(api: ApiRoommateAd): RoommateAd {
    const monthlyRent = this.toNumber(api.monthlyRent);
    const createdAt = this.normalizeIso(api.createdAt) ?? new Date().toISOString();
    const availableFrom = this.normalizeIso(api.availableFrom) ?? createdAt;
    const profile = this.mapProfile(api.profile);
    const location = this.mapLocation(api.location, api.propertyLocation);
    const contact = this.mapContact(api.contact, api.authorName, profile?.name);
    const ratings = this.mapRatings(api.ratings);
    const ratingCount = typeof api.ratingCount === 'number' ? api.ratingCount : ratings.length;
    const averageRating = typeof api.averageRating === 'number'
      ? api.averageRating
      : this.computeAverageRating(ratings);
    const availability = this.mapAvailability(api.availability);

    return {
      id: api.id,
      title: api.title ?? 'Αγγελία συγκάτοικου',
      description: api.description ?? '',
      monthlyRent,
      propertyLocation: location?.city ?? api.propertyLocation ?? 'Μη διαθέσιμη τοποθεσία',
      mode: this.normalizeMode(api.mode),
      availableFrom,
      createdAt,
      published: api.published,
      authorId: api.authorId,
      preferences: this.normalizeStringArray(api.preferences),
      propertyFeatures: this.normalizeStringArray(api.propertyFeatures),
      lifestyle: this.normalizeStringArray(api.lifestyle),
      images: this.pickImages(api.images),
      amenities: this.normalizeStringArray(api.amenities),
      profile,
      location,
      contact,
      ratings,
      ratingCount,
      averageRating,
      lastRatedAt: this.normalizeIso(api.lastRatedAt),
      availability
    };
  }

  private normalizeMode(value: string | undefined): RoommateAdMode {
    const normalized = (value ?? '').toUpperCase();
    switch (normalized) {
      case 'FINDING_HOME_WITH_ROOMMATE':
        return 'FINDING_HOME_WITH_ROOMMATE';
      case 'LOOKING_FOR_ROOM':
        return 'LOOKING_FOR_ROOM';
      case 'VACANCY_NEEDS_ROOMMATE':
        return 'VACANCY_NEEDS_ROOMMATE';
      case 'HOST_SEEKING_ROOMMATE':
      default:
        return 'HOST_SEEKING_ROOMMATE';
    }
  }

  private mapProfile(api?: ApiRoommateProfile): RoommateAd['profile'] | undefined {
    if (!api) {
      return undefined;
    }

    const name = this.normalizeString(api.name) || 'Μέλος Unihome';
    const interests = this.normalizeStringArray(api.interests);
    const habits = this.normalizeStringArray(api.habits);
    const age = this.normalizeNumber(api.age);

    return {
      name,
      age,
      gender: this.normalizeString(api.gender) || undefined,
      university: this.normalizeString(api.university) || undefined,
      department: this.normalizeString(api.department) || undefined,
      semester: this.normalizeString(api.semester) || undefined,
      bio: this.normalizeString(api.bio) || undefined,
      avatar: this.normalizeString(api.avatar) || undefined,
      interests: interests.length ? interests : undefined,
      habits: habits.length ? habits : undefined,
      isStudent: typeof api.student === 'boolean' ? api.student : undefined
    };
  }

  private mapLocation(api: ApiRoommateLocation | undefined, fallback?: string): RoommateAd['location'] | undefined {
    if (!api && !fallback) {
      return undefined;
    }

    const city = this.normalizeString(api?.city) || this.normalizeString(fallback);
    const area = this.normalizeString(api?.area);
    const proximity = this.normalizeString(api?.proximity);

    if (!city && !area && !proximity) {
      return undefined;
    }

    return {
      city: city || 'Σάμος',
      area: area || undefined,
      proximity: proximity || undefined
    };
  }

  private mapContact(api: ApiRoommateContact | undefined, authorName?: string, profileName?: string): RoommateAd['contact'] {
    const name = this.normalizeString(api?.name) || this.normalizeString(profileName) || this.normalizeString(authorName) || FALLBACK_CONTACT.name;
    const phone = this.normalizeString(api?.phone) || FALLBACK_CONTACT.phone;
    const email = this.normalizeString(api?.email) || FALLBACK_CONTACT.email;
    const instagram = this.normalizeString(api?.instagram) || undefined;
    const facebook = this.normalizeString(api?.facebook) || undefined;

    return { name, phone, email, instagram, facebook };
  }

  private mapAvailability(api?: ApiAvailability): AvailabilitySchedule | undefined {
    if (!api) {
      return undefined;
    }

    const unavailable = (api.unavailable ?? [])
      .map(window => this.mapAvailabilityWindow(window))
      .filter((window): window is AvailabilityWindow => !!window);

    if (!unavailable.length && !api.note && !api.lastUpdated && !api.calendarUrl) {
      return undefined;
    }

    return {
      unavailable,
      note: this.normalizeString(api.note) || undefined,
      calendarUrl: this.normalizeString(api.calendarUrl) || undefined,
      lastUpdated: this.normalizeIso(api.lastUpdated) ?? new Date().toISOString()
    };
  }

  private mapAvailabilityWindow(api: ApiAvailabilityWindow): AvailabilityWindow | null {
    const startDate = this.normalizeIso(api.startDate);
    if (!startDate) {
      return null;
    }

    const window: AvailabilityWindow = { startDate };
    const endDate = this.normalizeIso(api.endDate);
    if (endDate) {
      window.endDate = endDate;
    }
    const label = this.normalizeString(api.label);
    if (label) {
      window.label = label;
    }
    return window;
  }

  private mapAvailabilityToRequest(schedule: AvailabilitySchedule): ApiAvailability {
    const unavailable = (schedule.unavailable ?? [])
      .map(window => {
        const startDate = this.extractLocalDate(window.startDate);
        if (!startDate) {
          return null;
        }
        const endDate = this.extractLocalDate(window.endDate);
        const label = this.normalizeString(window.label);
        return {
          startDate,
          endDate,
          label
        } as ApiAvailabilityWindow;
      })
      .filter((window): window is ApiAvailabilityWindow => window !== null);

    return {
      unavailable,
      note: this.normalizeString(schedule.note) || undefined,
      calendarUrl: this.normalizeString(schedule.calendarUrl) || undefined,
      lastUpdated: this.normalizeIso(schedule.lastUpdated)
    };
  }

  private mapRatings(ratings?: ApiRoommateRating[]): RoommateRating[] {
    if (!Array.isArray(ratings)) {
      return [];
    }

    const normalized: RoommateRating[] = [];
    for (const rating of ratings) {
      const score = this.normalizeNumber(rating.score);
      if (typeof score !== 'number' || score < 1 || score > 5) {
        continue;
      }

      normalized.push({
        id: rating.id,
        reviewerId: rating.reviewerId,
        reviewerName: this.normalizeString(rating.reviewerName) || 'Μέλος Unihome',
        score,
        comment: this.normalizeString(rating.comment) || undefined,
        createdAt: this.normalizeIso(rating.createdAt) ?? new Date().toISOString()
      });
    }

    return normalized;
  }

  private upsertAd(ad: RoommateAd): void {
    const existing = this.roommateAdsSubject.value.filter(item => item.id !== ad.id);
    this.roommateAdsSubject.next(this.sortByRecency([...existing, ad]));
  }

  private upsertMineAd(ad: RoommateAd): void {
    const existing = this.mineRoommateAdsSubject.value.filter(item => item.id !== ad.id);
    this.mineRoommateAdsSubject.next(this.sortByRecency([...existing, ad]));
  }

  private sortByRecency(ads: RoommateAd[]): RoommateAd[] {
    return [...ads].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? a.availableFrom).getTime();
      const bTime = new Date(b.createdAt ?? b.availableFrom).getTime();
      return bTime - aTime;
    });
  }

  private applyLocalFilters(ads: RoommateAd[], filters: RoommateFilters): RoommateAd[] {
    const searchNeedle = filters.searchQuery?.trim();
    const university = filters.university?.trim().toLowerCase();
    const lifestyle = filters.lifestyle?.trim().toLowerCase();
    const locationNeedle = filters.location?.trim();
    const gender = filters.gender?.trim().toLowerCase();
    const minAge = this.normalizeNumber(filters.minAge);
    const maxAge = this.normalizeNumber(filters.maxAge);
    const maxRent = this.normalizeNumber(filters.maxRent);
    const minRating = this.normalizeNumber(filters.minRating);
    const modeFilter = filters.mode;

    return ads.filter(ad => {
      if (typeof maxRent === 'number' && ad.monthlyRent > maxRent) {
        return false;
      }

      if (modeFilter && ad.mode !== modeFilter) {
        return false;
      }

      if (gender && ad.profile?.gender?.trim().toLowerCase() !== gender) {
        return false;
      }

      const age = ad.profile?.age;
      if (typeof minAge === 'number' && (typeof age !== 'number' || age < minAge)) {
        return false;
      }
      if (typeof maxAge === 'number' && (typeof age !== 'number' || age > maxAge)) {
        return false;
      }

      if (university) {
        const targetUniversity = ad.profile?.university?.trim().toLowerCase();
        if (!targetUniversity || targetUniversity !== university) {
          return false;
        }
      }

      if (lifestyle) {
        const hasLifestyle = (ad.lifestyle ?? []).some(item => item.trim().toLowerCase() === lifestyle);
        if (!hasLifestyle) {
          return false;
        }
      }

      if (
        locationNeedle &&
        !matchesSearchNeedle(
          [ad.location?.city, ad.location?.area, ad.location?.proximity, ad.propertyLocation],
          locationNeedle
        )
      ) {
        return false;
      }

      if (typeof minRating === 'number') {
        const average = typeof ad.averageRating === 'number' ? ad.averageRating : this.computeAverageRating(ad.ratings ?? []);
        if (!average || average < minRating) {
          return false;
        }
      }

      if (filters.studentOnly === true) {
        if (ad.profile?.isStudent === false) {
          return false;
        }
      }

      if (
        searchNeedle &&
        !matchesSearchNeedle(
          [
            ad.title,
            ad.description,
            ad.profile?.name,
            ad.profile?.bio,
            ad.profile?.university,
            ad.profile?.department,
            ...(ad.lifestyle ?? []),
            ...(ad.preferences ?? []),
            ...(ad.amenities ?? [])
          ],
          searchNeedle
        )
      ) {
        return false;
      }

      return true;
    });
  }

  private pickImages(images?: string[]): string[] {
    const normalized = this.normalizeStringArray(images);
    return normalized;
  }

  private normalizeString(value: string | undefined | null): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeStringArray(values: string[] | undefined): string[] {
    if (!Array.isArray(values)) {
      return [];
    }
    const deduped = new Set<string>();
    for (const value of values) {
      const normalized = this.normalizeString(value);
      if (normalized) {
        deduped.add(normalized);
      }
    }
    return Array.from(deduped);
  }

  private normalizeIso(value: string | undefined | null): string | undefined {
    const trimmed = this.normalizeString(value);
    if (!trimmed) {
      return undefined;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  }

  private extractLocalDate(value: string | undefined): string | undefined {
    const trimmed = this.normalizeString(value);
    if (!trimmed) {
      return undefined;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  private normalizeNumber(value: unknown): number | undefined {
    const parsed = this.toNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private computeAverageRating(ratings: RoommateRating[]): number | undefined {
    if (!ratings.length) {
      return undefined;
    }
    const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
    return Math.round((total / ratings.length) * 10) / 10;
  }

  private composeFullName(student: StudentUser): string {
    const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
    return name || 'Μέλος Unihome';
  }

  private composeReviewerName(user: User): string {
    const first = this.normalizeString(user.firstName);
    const last = this.normalizeString(user.lastName);
    const name = `${first} ${last}`.trim();
    return name || 'Μέλος Unihome';
  }

  private safeRequireUser(): User {
    try {
      return this.authService.requireUser();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Απαιτείται σύνδεση για αυτή την ενέργεια.');
    }
  }
}
