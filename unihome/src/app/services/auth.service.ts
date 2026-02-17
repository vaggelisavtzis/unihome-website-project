import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { OwnerUser, StudentUser, User, UserRole, isOwnerUser, isStudentUser } from '../models/user.model';

export interface AuthResult {
  success: boolean;
  message?: string;
}

export type LoginMethod = 'email';

export interface LoginPayload {
  identifier: string;
  method: LoginMethod;
  password: string;
  role: UserRole;
}

export interface StudentRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  university?: string;
  department?: string;
  isStudent: boolean;
  password: string;
  confirmPassword: string;
}

export interface OwnerRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number | null;
  address: string;
  password: string;
  confirmPassword: string;
}

type ApiAuthRole = 'STUDENT' | 'OWNER' | 'REGULAR';

type ApiFavoriteType = 'PROPERTY' | 'ROOMMATE_AD' | 'TEMPORARY_STAY';

interface AuthApiUserSummary {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: ApiAuthRole;
  createdAt?: string;
  age?: number;
}

interface AuthApiResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthApiUserSummary;
}

interface ApiUserProfileResponse {
  user: AuthApiUserSummary;
  studentProfile?: ApiStudentProfileDto;
  ownerProfile?: ApiOwnerProfileDto;
}

interface ApiStudentProfileDto {
  university?: string;
  department?: string;
  semester?: string;
  student?: boolean;
}

interface ApiOwnerProfileDto {
  address?: string;
  vatNumber?: string;
}

interface ApiFavoriteResponse {
  id: string;
  type: ApiFavoriteType;
  targetId: string;
  createdAt?: string;
}

interface ApiToggleFavoriteResponse {
  favorite?: boolean;
  favoriteEntry?: ApiFavoriteResponse | null;
}

interface StoredSessionPayload {
  user?: User;
  accessToken?: string;
  expiresAt?: string;
}

const SESSION_STORAGE_KEY = 'unihome_current_user';
const ACCESS_TOKEN_STORAGE_KEY = 'unihome_access_token';

const browserStorage = () => (typeof window !== 'undefined' ? window.localStorage : undefined);

const ensureString = (value: any, fallback = ''): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
};

const ensureEmail = (value: any, fallback = ''): string => {
  const email = ensureString(value, fallback).toLowerCase();
  return email;
};

const ensureIsoDate = (value: any): string => {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return new Date().toISOString();
};

const ensureAge = (value: any): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const rounded = Math.round(parsed);
  if (rounded < 16 || rounded > 120) {
    return undefined;
  }
  return rounded;
};

const trimPhone = (value: any): string | undefined => {
  const phone = ensureString(value).replace(/\s+/g, '');
  if (!phone.length) {
    return undefined;
  }
  if (/^[\-\u2013\u2014]+$/.test(phone)) {
    return undefined;
  }
  return phone;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;
  private currentUser: User | null = null;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
    if (this.accessToken) {
      this.refreshCurrentUser().pipe(catchError(() => of(null))).subscribe();
    } else {
      this.emitCurrentUser();
    }
  }

  registerStudent(payload: StudentRegistrationPayload): Observable<AuthResult> {
    if (payload.password !== payload.confirmPassword) {
      return of({ success: false, message: 'Οι κωδικοί δεν ταιριάζουν.' });
    }

    const normalizedEmail = ensureEmail(payload.email ?? '');
    if (!normalizedEmail.length) {
      return of({ success: false, message: 'Συμπλήρωσε έγκυρο email.' });
    }

    const phone = trimPhone(payload.phone);
    if (!phone) {
      return of({ success: false, message: 'Συμπλήρωσε έγκυρο αριθμό κινητού.' });
    }

    const age = ensureAge(payload.age);
    const student = !!payload.isStudent;
    const body = {
      email: normalizedEmail,
      password: ensureString(payload.password),
      firstName: ensureString(payload.firstName),
      lastName: ensureString(payload.lastName),
      phone,
      age,
      university: student ? ensureString(payload.university) : null,
      department: student ? ensureString(payload.department) : null,
      semester: undefined,
      student
    };

    return this.http
      .post<AuthApiResponse>(`${this.apiUrl}/auth/register/student`, body)
      .pipe(
        switchMap(response => this.processAuthResponse(response)),
        map(() => ({ success: true } as AuthResult)),
        catchError(error => this.handleAuthError(error))
      );
  }

  registerOwner(payload: OwnerRegistrationPayload): Observable<AuthResult> {
    if (payload.password !== payload.confirmPassword) {
      return of({ success: false, message: 'Οι κωδικοί δεν ταιριάζουν.' });
    }

    const normalizedEmail = ensureEmail(payload.email ?? '');
    if (!normalizedEmail.length) {
      return of({ success: false, message: 'Συμπλήρωσε έγκυρο email.' });
    }

    const phone = trimPhone(payload.phone);
    if (!phone) {
      return of({ success: false, message: 'Συμπλήρωσε έγκυρο αριθμό κινητού.' });
    }

    const age = ensureAge(payload.age);

    const body: Record<string, unknown> = {
      email: normalizedEmail,
      password: ensureString(payload.password),
      firstName: ensureString(payload.firstName),
      lastName: ensureString(payload.lastName),
      phone,
      address: ensureString(payload.address)
    };

    if (typeof age === 'number') {
      body['age'] = age;
    }

    return this.http
      .post<AuthApiResponse>(`${this.apiUrl}/auth/register/owner`, body)
      .pipe(
        switchMap(response => this.processAuthResponse(response)),
        map(() => ({ success: true } as AuthResult)),
        catchError(error => this.handleAuthError(error))
      );
  }

  login(payload: LoginPayload): Observable<AuthResult> {
    const identifier = ensureEmail(payload.identifier);
    if (!identifier.length) {
      return of({ success: false, message: 'Συμπλήρωσε έγκυρο email.' });
    }

    const body = {
      email: identifier,
      password: ensureString(payload.password)
    };

    return this.http.post<AuthApiResponse>(`${this.apiUrl}/auth/login`, body).pipe(
      switchMap(response => {
        const resolvedRole = this.mapApiRole(response.user.role);
        if (resolvedRole !== payload.role) {
          return of({ success: false, message: 'Το email αντιστοιχεί σε διαφορετικό τύπο λογαριασμού.' });
        }
        return this.processAuthResponse(response).pipe(map(() => ({ success: true } as AuthResult)));
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  logout(): void {
    this.accessToken = null;
    this.accessTokenExpiry = null;
    this.persistAccessToken(null);
    this.setCurrentUser(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  currentUserSnapshot(): User | null {
    return this.currentUser ? this.cloneUser(this.currentUser) : null;
  }

  currentStudentSnapshot(): StudentUser | null {
    if (this.currentUser && isStudentUser(this.currentUser)) {
      return this.cloneUser(this.currentUser);
    }
    return null;
  }

  currentOwnerSnapshot(): OwnerUser | null {
    if (this.currentUser && isOwnerUser(this.currentUser)) {
      return this.cloneUser(this.currentUser);
    }
    return null;
  }

  requireUser(): User {
    if (!this.currentUser) {
      throw new Error('Απαιτείται σύνδεση.');
    }
    return this.cloneUser(this.currentUser);
  }

  requireStudent(): StudentUser {
    const snapshot = this.currentStudentSnapshot();
    if (!snapshot) {
      throw new Error('Απαιτείται προφίλ μέλους.');
    }
    return snapshot;
  }

  requireOwner(): OwnerUser {
    const snapshot = this.currentOwnerSnapshot();
    if (!snapshot) {
      throw new Error('Απαιτείται προφίλ ιδιοκτήτη.');
    }
    return snapshot;
  }

  updateUser(updated: User): Observable<AuthResult> {
    if (!this.accessToken) {
      return of({ success: false, message: 'Πρέπει να συνδεθείς για να ενημερώσεις το προφίλ σου.' });
    }

    const generalBody: Record<string, unknown> = {
      email: ensureEmail(updated.email ?? ''),
      firstName: ensureString(updated.firstName),
      lastName: ensureString(updated.lastName),
      phone: trimPhone(updated.phone),
      age: typeof updated.age === 'number' ? updated.age : undefined
    };

    let update$ = this.http.put<ApiUserProfileResponse>(`${this.apiUrl}/users/me`, generalBody);

    if (isStudentUser(updated)) {
      const student = updated.profile.isStudent !== false;
      const studentBody = {
        university: student ? ensureString(updated.profile.university) : null,
        department: student ? ensureString(updated.profile.department) : null,
        semester: undefined,
        student
      };
      update$ = update$.pipe(switchMap(() => this.http.put<ApiUserProfileResponse>(`${this.apiUrl}/users/me/student`, studentBody)));
    } else if (isOwnerUser(updated)) {
      const ownerBody = {
        address: ensureString(updated.profile.address),
        vatNumber: ensureString(updated.profile.vatNumber ?? '') || undefined
      };
      update$ = update$.pipe(switchMap(() => this.http.put<ApiUserProfileResponse>(`${this.apiUrl}/users/me/owner`, ownerBody)));
    }

    return update$
      .pipe(
        switchMap(() => this.refreshCurrentUser()),
        map(() => ({ success: true } as AuthResult)),
        catchError(error => this.handleAuthError(error))
      );
  }

  refreshCurrentUser(): Observable<User | null> {
    if (!this.accessToken) {
      this.setCurrentUser(null);
      return of(null);
    }

    const profile$ = this.http.get<ApiUserProfileResponse>(`${this.apiUrl}/users/me`);
    const favorites$ = this.http.get<ApiFavoriteResponse[]>(`${this.apiUrl}/favorites`, {
      params: new HttpParams().set('type', 'PROPERTY')
    });

    return forkJoin({ profile: profile$, favorites: favorites$ }).pipe(
      map(({ profile, favorites }) => this.mapProfileResponse(profile, favorites)),
      tap(user => this.setCurrentUser(user)),
      map(user => user),
      catchError(error => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.logout();
          return of(null);
        }
        console.error('Failed to refresh προφίλ', error);
        return throwError(() => error);
      })
    );
  }

  togglePropertyFavorite(propertyId: string): Observable<{ success: boolean; favorite: boolean; message?: string }> {
    const targetId = ensureString(propertyId);
    if (!targetId.length) {
      return of({ success: false, favorite: this.hasFavoriteLocally(targetId), message: 'Μη έγκυρο ακίνητο.' });
    }

    if (!this.accessToken) {
      return of({
        success: false,
        favorite: this.hasFavoriteLocally(targetId),
        message: 'Πρέπει να συνδεθείς για να διαχειριστείς αγαπημένα.'
      });
    }

    const body = {
      type: 'PROPERTY' as ApiFavoriteType,
      targetId
    };

    return this.http.post<ApiToggleFavoriteResponse>(`${this.apiUrl}/favorites/toggle`, body).pipe(
      switchMap(response =>
        this.refreshCurrentUser().pipe(
          map(() => ({
            success: true,
            favorite: typeof response.favorite === 'boolean' ? response.favorite : this.hasFavoriteLocally(targetId)
          }))
        )
      ),
      catchError(error => {
        const fallbackFavorite = this.hasFavoriteLocally(targetId);
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401 || error.status === 403) {
            this.logout();
            return of({
              success: false,
              favorite: fallbackFavorite,
              message: 'Η συνεδρία σου έληξε. Συνδέσου ξανά.'
            });
          }
          const backendMessage = this.extractBackendMessage(error);
          if (backendMessage) {
            return of({ success: false, favorite: fallbackFavorite, message: backendMessage });
          }
        }

        console.error('Δεν ήταν δυνατή η ενημέρωση αγαπημένου', error);
        return of({
          success: false,
          favorite: fallbackFavorite,
          message: 'Δεν ήταν δυνατή η ενημέρωση των αγαπημένων. Δοκίμασε ξανά.'
        });
      })
    );
  }

  removeFavoriteLocally(propertyId: string): void {
    const targetId = ensureString(propertyId);
    if (!targetId.length || !this.currentUser) {
      return;
    }

    if (!this.currentUser.favorites.includes(targetId)) {
      return;
    }

    const nextFavorites = this.currentUser.favorites.filter(id => id !== targetId);
    const updatedUser: User = { ...this.currentUser, favorites: nextFavorites } as User;
    this.setCurrentUser(updatedUser);
  }

  private processAuthResponse(response: AuthApiResponse): Observable<User> {
    this.accessToken = response.accessToken;
    this.accessTokenExpiry = Number.isFinite(response.expiresIn)
      ? Date.now() + response.expiresIn * 1000
      : null;
    this.persistAccessToken(this.accessToken);
    return this.refreshCurrentUser().pipe(
      switchMap(user =>
        user
          ? of(user)
          : throwError(() => new Error('Δεν ήταν δυνατή η επαλήθευση του λογαριασμού. Δοκίμασε ξανά.'))
      )
    );
  }

  private mapProfileResponse(profile: ApiUserProfileResponse, favorites: ApiFavoriteResponse[]): User {
    const summary = profile.user;
    const role = this.mapApiRole(summary.role);
    const favoriteIds = favorites
      .filter(item => item.type === 'PROPERTY' && !!item.targetId)
      .map(item => item.targetId);

    const base = {
      id: summary.id,
      role,
      email: ensureEmail(summary.email ?? ''),
      password: '',
      firstName: ensureString(summary.firstName),
      lastName: ensureString(summary.lastName),
      phone: trimPhone(summary.phone),
      age: ensureAge(summary.age),
      createdAt: ensureIsoDate(summary.createdAt),
      favorites: favoriteIds
    } as User;

    if (role === 'owner') {
      const ownerProfile = profile.ownerProfile ?? {};
      return {
        ...base,
        role: 'owner',
        profile: {
          address: ensureString(ownerProfile.address, 'Μη διαθέσιμη διεύθυνση'),
          vatNumber: ensureString(ownerProfile.vatNumber ?? '') || undefined
        }
      } satisfies OwnerUser;
    }

    const studentProfile = profile.studentProfile ?? {};
    const isStudent = studentProfile.student !== false;
    return {
      ...base,
      role: 'student',
      profile: {
        university: isStudent ? ensureString(studentProfile.university, 'Μη διαθέσιμο') : '',
        department: isStudent ? ensureString(studentProfile.department, 'Μη διαθέσιμο') : '',
        isStudent
      }
    } satisfies StudentUser;
  }

  private mapApiRole(role: ApiAuthRole): UserRole {
    if (role === 'OWNER') {
      return 'owner';
    }
    return 'student';
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser = user ? this.cloneUser(user) : null;
    this.persistSession(this.currentUser, this.accessToken, this.accessTokenExpiry);
    this.emitCurrentUser();
  }

  private emitCurrentUser(): void {
    this.currentUserSubject.next(this.currentUser ? this.cloneUser(this.currentUser) : null);
  }

  private hasFavoriteLocally(propertyId: string): boolean {
    return !!this.currentUser && this.currentUser.favorites.includes(propertyId);
  }

  private cloneUser<T extends User>(user: T): T {
    const clone: T = {
      ...user,
      favorites: [...user.favorites],
      profile: { ...user.profile }
    } as T;
    return clone;
  }

  private extractBackendMessage(error: HttpErrorResponse): string | undefined {
    const details = (error.error as { details?: unknown } | undefined)?.details;
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      const entries = Object.entries(details as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string' && value.trim().length);
      if (entries.length) {
        return entries.map(([field, message]) => this.formatValidationMessage(field, String(message))).join(' ');
      }
    }

    const backendMessage = error.error?.message ?? error.error?.error;
    if (typeof backendMessage === 'string') {
      const normalized = backendMessage.trim();
      if (normalized.length) {
        return normalized;
      }
    }
    return undefined;
  }

  private formatValidationMessage(field: string, message: string): string {
    const normalizedMessage = message.trim();
    if (!normalizedMessage.length) {
      return 'Μη έγκυρα στοιχεία.';
    }

    if (field === 'password' && normalizedMessage.toLowerCase().includes('size')) {
      return 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.';
    }

    const greekField = (() => {
      switch (field) {
        case 'firstName':
          return 'όνομα';
        case 'lastName':
          return 'επώνυμο';
        case 'email':
          return 'email';
        case 'phone':
          return 'τηλέφωνο';
        case 'university':
          return 'πανεπιστήμιο';
        case 'department':
          return 'τμήμα';
        default:
          return field;
      }
    })();

    if (normalizedMessage === 'must not be blank') {
      return `Το πεδίο "${greekField}" είναι υποχρεωτικό.`;
    }

    if (normalizedMessage === 'must not be null') {
      return `Το πεδίο "${greekField}" είναι υποχρεωτικό.`;
    }

    return `Μη έγκυρο πεδίο "${greekField}": ${normalizedMessage}`;
  }

  private restoreSession(): void {
    const storage = browserStorage();
    if (!storage) {
      return;
    }

    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const session: StoredSessionPayload = JSON.parse(raw);
      if (session.accessToken) {
        this.accessToken = session.accessToken;
      }
      if (session.expiresAt) {
        const expiresAt = Date.parse(session.expiresAt);
        this.accessTokenExpiry = Number.isNaN(expiresAt) ? null : expiresAt;
      }
      if (session.user) {
        this.currentUser = this.cloneUser(session.user as User);
      }
    } catch (error) {
      console.error('Failed to restore auth session', error);
      storage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private persistSession(user: User | null, token: string | null = this.accessToken, expiresAtMillis: number | null = this.accessTokenExpiry): void {
    const storage = browserStorage();
    if (!storage) {
      return;
    }

    if (!user) {
      storage.removeItem(SESSION_STORAGE_KEY);
      this.persistAccessToken(null);
      return;
    }

    const storedUser = this.cloneUser(user);
    const payload: StoredSessionPayload = {
      user: storedUser,
      accessToken: token ?? undefined,
      expiresAt: expiresAtMillis ? new Date(expiresAtMillis).toISOString() : undefined
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  }

  private persistAccessToken(token: string | null): void {
    const storage = browserStorage();
    if (!storage) {
      return;
    }

    if (!token) {
      storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      return;
    }

    storage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }

  private handleAuthError(error: unknown): Observable<AuthResult> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return of({ success: false, message: 'Δεν υπάρχει σύνδεση με τον διακομιστή.' });
      }

      if (error.status === 401 || error.status === 403) {
        return of({ success: false, message: 'Μη έγκυρα στοιχεία σύνδεσης.' });
      }

      if (error.status === 409) {
        return of({ success: false, message: 'Το email χρησιμοποιείται ήδη.' });
      }

      const backendMessage = this.extractBackendMessage(error);
      if (backendMessage) {
        return of({ success: false, message: backendMessage });
      }
    }

    if (error instanceof Error) {
      const message = error.message?.trim();
      if (message.length) {
        return of({ success: false, message });
      }
    }

    console.error('Authentication request failed', error);
    return of({ success: false, message: 'Κάτι πήγε στραβά. Δοκίμασε ξανά αργότερα.' });
  }
}
