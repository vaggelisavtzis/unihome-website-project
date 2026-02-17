import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { RoommateAd, RoommateAdMode } from '../../../models/roommate.model';
import { AuthService } from '../../../services/auth.service';
import { StudentUser, UserRole } from '../../../models/user.model';
import { RoommateFilters, RoommateService } from '../../../services/roommate.service';
import { LocationPickerComponent } from '../../../shared/location-picker/location-picker';

@Component({
  selector: 'app-roommate-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIf, NgForOf, LocationPickerComponent],
  templateUrl: './roommate-list.html',
  styleUrls: ['./roommate-list.scss']
})
export class RoommateListComponent implements OnInit, OnDestroy {
  filters = {
    searchQuery: '',
    university: '',
    maxRent: null as number | null,
    lifestyle: '',
    location: '',
    gender: '' as RoommateGenderFilter,
    mode: '' as RoommateModeFilter,
    minAge: null as number | null,
    maxAge: null as number | null,
    minRating: null as number | null
  };

  readonly ageSliderMin = 16;
  readonly ageSliderMax = 60;

  minAgeControl = 16;
  maxAgeControl = 60;

  universities: string[] = [];
  lifestyleOptions: string[] = [];
  visibleRoommates: RoommateAd[] = [];
  readonly sortOptions: ReadonlyArray<{ value: RoommateSortOption; label: string }> = [
    { value: 'recent', label: 'Πιο πρόσφατες' },
    { value: 'rent-asc', label: 'Χαμηλότερο μίσθωμα' },
    { value: 'rent-desc', label: 'Υψηλότερο μίσθωμα' },
    { value: 'availability', label: 'Διαθεσιμότητα (συντομότερα)' },
    { value: 'alphabetical', label: 'Αλφαβητικά' }
  ];
  readonly genderOptions: ReadonlyArray<{ value: RoommateGenderFilter; label: string }> = [
    { value: '', label: 'Όλα τα προφίλ' },
    { value: 'Γυναίκα', label: 'Μόνο γυναίκες' },
    { value: 'Άνδρας', label: 'Μόνο άνδρες' },
    { value: 'Μη δυαδικό', label: 'Μη δυαδικά προφίλ' }
  ];
  readonly modeFilterOptions: ReadonlyArray<{ value: RoommateModeFilter; label: string }> = [
    { value: '', label: 'Όλοι οι τύποι' },
    { value: 'HOST_SEEKING_ROOMMATE', label: 'Έχω ήδη σπίτι' },
    { value: 'FINDING_HOME_WITH_ROOMMATE', label: 'Θα βρούμε σπίτι μαζί' },
    { value: 'LOOKING_FOR_ROOM', label: 'Ψάχνω συγκάτοικο με σπίτι' }
  ];
  readonly ratingOptions: ReadonlyArray<{ value: number | null; label: string }> = [
    { value: null, label: 'Όλες οι αξιολογήσεις' },
    { value: 3, label: 'Βαθμολογία 3+' },
    { value: 4, label: 'Βαθμολογία 4+' },
    { value: 4.5, label: 'Βαθμολογία 4.5+' }
  ];
  selectedSort: RoommateSortOption = 'recent';
  isLoggedIn = false;
  feedback: { text: string; tone: 'success' | 'error' } | null = null;

  private readonly subscription = new Subscription();
  private currentUserId: string | null = null;
  private currentUserRole: UserRole | null = null;
  private feedbackTimer: number | null = null;
  private lastFilteredAds: RoommateAd[] = [];
  private currentUserProfileIsStudent = false;
  private readonly modeLabels: Record<RoommateAdMode, string> = {
    HOST_SEEKING_ROOMMATE: 'Έχει ήδη σπίτι για συγκάτοικο',
    FINDING_HOME_WITH_ROOMMATE: 'Θα βρουν σπίτι μαζί',
    LOOKING_FOR_ROOM: 'Αναζητά συγκάτοικο με σπίτι',
    VACANCY_NEEDS_ROOMMATE: 'Διαθέτει δωμάτιο για συγκάτοικο'
  };
  private readonly modeClasses: Record<RoommateAdMode, string> = {
    HOST_SEEKING_ROOMMATE: 'mode-badge--host',
    FINDING_HOME_WITH_ROOMMATE: 'mode-badge--partner',
    LOOKING_FOR_ROOM: 'mode-badge--seeker',
    VACANCY_NEEDS_ROOMMATE: 'mode-badge--vacancy'
  };

  constructor(
    private roommateService: RoommateService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roommateService.ensureLoaded();

    this.subscription.add(
      this.roommateService.roommateAds$.subscribe(ads => {
        this.universities = this.roommateService.getDistinctUniversities();
        this.lifestyleOptions = this.collectLifestyleOptions(ads);
        this.applyFilters();
      })
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(() => {
        this.captureAuthState();
      })
    );
    this.captureAuthState();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  applyFilters(): void {
    const minAge = this.normalizeNumber(
      this.filters.minAge !== null ? this.filters.minAge : undefined
    );
    const maxAge = this.normalizeNumber(
      this.filters.maxAge !== null ? this.filters.maxAge : undefined
    );
    const normalizedAges = this.normalizeAgeRange(minAge, maxAge);
    if (normalizedAges.min !== undefined) {
      this.minAgeControl = normalizedAges.min;
    }
    if (normalizedAges.max !== undefined) {
      this.maxAgeControl = normalizedAges.max;
    }
    const minRating = this.normalizeNumber(this.filters.minRating);

    const normalized: RoommateFilters = {
      searchQuery: this.filters.searchQuery.trim() || undefined,
      university: this.filters.university || undefined,
      lifestyle: this.filters.lifestyle || undefined,
      location: this.filters.location.trim() || undefined,
      mode: this.filters.mode || undefined,
      maxRent: this.normalizeNumber(this.filters.maxRent),
      gender: this.filters.gender || undefined,
      minAge: normalizedAges.min,
      maxAge: normalizedAges.max,
      minRating
    };

    const results = this.roommateService.filterAds(normalized);
    this.lastFilteredAds = results;
    this.visibleRoommates = this.sortRoommates(results);
  }

  resetFilters(): void {
    this.filters = {
      searchQuery: '',
      university: '',
      maxRent: null,
      lifestyle: '',
      location: '',
      gender: '',
      mode: '',
      minAge: null,
      maxAge: null,
      minRating: null
    };
    this.minAgeControl = this.ageSliderMin;
    this.maxAgeControl = this.ageSliderMax;
    this.applyFilters();
  }

  onSortChange(option: RoommateSortOption): void {
    this.selectedSort = option;
    this.visibleRoommates = this.sortRoommates(this.lastFilteredAds);
  }

  onAgeSliderChange(): void {
    const normalized = this.normalizeAgeRange(this.minAgeControl, this.maxAgeControl);
    if (normalized.min !== undefined) {
      this.minAgeControl = normalized.min;
    }
    if (normalized.max !== undefined) {
      this.maxAgeControl = normalized.max;
    }
    const isFullRange =
      normalized.min === this.ageSliderMin && normalized.max === this.ageSliderMax;
    this.filters = {
      ...this.filters,
      minAge: isFullRange ? null : normalized.min ?? null,
      maxAge: isFullRange ? null : normalized.max ?? null
    };
    this.applyFilters();
  }

  clearAgeRange(): void {
    this.filters = { ...this.filters, minAge: null, maxAge: null };
    this.minAgeControl = this.ageSliderMin;
    this.maxAgeControl = this.ageSliderMax;
    this.applyFilters();
  }

  onPostRoommate(): void {
    if (this.canCreateRoommate) {
      this.router.navigate(['/roommates/add']);
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { role: 'student', redirectTo: '/roommates/add' }
    });
  }

  avatarFor(ad: RoommateAd): string | null {
    return ad.profile?.avatar || ad.images?.[0] || null;
  }

  initialsFor(ad: RoommateAd): string {
    const source = (ad.profile?.name || ad.title || '').trim();
    if (!source) {
      return 'U';
    }
    const parts = source.split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map(part => part[0]).join('');
    return initials.toUpperCase();
  }

  modeBadgeLabel(ad: RoommateAd): string {
    return this.modeLabels[ad.mode] ?? this.modeLabels.HOST_SEEKING_ROOMMATE;
  }

  modeBadgeClass(ad: RoommateAd): string {
    return this.modeClasses[ad.mode] ?? this.modeClasses.HOST_SEEKING_ROOMMATE;
  }

  formatRent(rent: number): string {
    return `${rent.toLocaleString('el-GR')} € / μήνα`;
  }

  formatAvailableFrom(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return 'Άμεσα διαθέσιμο';
    }

    return new Intl.DateTimeFormat('el-GR', {
      day: 'numeric',
      month: 'long'
    }).format(parsed);
  }

  availabilityHint(date: string): string {
    const target = new Date(date);
    if (Number.isNaN(target.getTime())) {
      return 'Διαθέσιμο τώρα';
    }

    const today = new Date();
    const diff = Math.ceil((target.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diff <= 0) {
      return 'Διαθέσιμο τώρα';
    }
    return `Σε ${diff} ${diff === 1 ? 'ημέρα' : 'ημέρες'}`;
  }

  trackByRoommate(_: number, ad: RoommateAd): string {
    return ad.id;
  }

  canDelete(ad: RoommateAd): boolean {
    if (!ad) {
      return false;
    }

    return this.currentUserRole === 'student'
      && this.currentUserProfileIsStudent
      && this.currentUserId === ad.authorId;
  }

  get canCreateRoommate(): boolean {
    return this.currentUserRole === 'student' && this.currentUserProfileIsStudent;
  }

  get showRoommateCta(): boolean {
    return !this.isLoggedIn || this.canCreateRoommate;
  }

  deleteAd(ad: RoommateAd): void {
    if (!this.canDelete(ad)) {
      this.setFeedback('Δεν έχεις δικαίωμα διαγραφής αυτής της αγγελίας.', 'error');
      return;
    }

    const confirmed = window.confirm(`Να διαγραφεί η αγγελία "${ad.title}";`);
    if (!confirmed) {
      return;
    }

    this.roommateService.removeAd(ad.id).subscribe({
      next: () => {
        this.setFeedback('Η αγγελία διαγράφηκε με επιτυχία.', 'success');
      },
      error: error => {
        const message = error instanceof Error
          ? error.message
          : 'Η διαγραφή δεν ολοκληρώθηκε.';
        this.setFeedback(message, 'error');
      }
    });
  }

  private captureAuthState(): void {
    const user = this.authService.currentUserSnapshot();
    this.isLoggedIn = this.authService.isLoggedIn();
    if (user) {
      this.currentUserId = user.id;
      this.currentUserRole = user.role;
      this.currentUserProfileIsStudent = user.role === 'student'
        ? (user as StudentUser).profile.isStudent !== false
        : false;
    } else {
      this.currentUserId = null;
      this.currentUserRole = null;
      this.currentUserProfileIsStudent = false;
    }
  }

  private normalizeNumber(value: number | null | undefined): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private normalizeAgeRange(minAge?: number, maxAge?: number): { min?: number; max?: number } {
    const clampedMin = this.clampAge(minAge);
    const clampedMax = this.clampAge(maxAge);

    if (clampedMin !== undefined && clampedMax !== undefined && clampedMin > clampedMax) {
      return { min: clampedMax, max: clampedMin };
    }

    return { min: clampedMin, max: clampedMax };
  }

  private clampAge(value?: number): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    return Math.min(this.ageSliderMax, Math.max(this.ageSliderMin, value));
  }

  get ageRangeBackground(): string {
    const minPercent = this.sliderPercent(this.minAgeControl);
    const maxPercent = this.sliderPercent(this.maxAgeControl);
    return `linear-gradient(90deg, var(--slider-bg) ${minPercent}%, var(--slider-fill) ${minPercent}%, var(--slider-fill) ${maxPercent}%, var(--slider-bg) ${maxPercent}%)`;
  }

  private sliderPercent(value: number): number {
    const range = this.ageSliderMax - this.ageSliderMin;
    if (range <= 0) {
      return 0;
    }

    const clamped = Math.min(this.ageSliderMax, Math.max(this.ageSliderMin, value));
    return ((clamped - this.ageSliderMin) / range) * 100;
  }

  private sortByRecency(ads: RoommateAd[]): RoommateAd[] {
    return [...ads].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? a.availableFrom).getTime();
      const bTime = new Date(b.createdAt ?? b.availableFrom).getTime();
      return bTime - aTime;
    });
  }

  private sortRoommates(ads: RoommateAd[]): RoommateAd[] {
    switch (this.selectedSort) {
      case 'rent-asc':
        return [...ads].sort((a, b) => a.monthlyRent - b.monthlyRent);
      case 'rent-desc':
        return [...ads].sort((a, b) => b.monthlyRent - a.monthlyRent);
      case 'availability':
        return [...ads].sort((a, b) => {
          const aTime = this.parseAvailability(a.availableFrom);
          const bTime = this.parseAvailability(b.availableFrom);
          return aTime - bTime;
        });
      case 'alphabetical':
        return [...ads].sort((a, b) => this.displayName(a).localeCompare(this.displayName(b), 'el', { sensitivity: 'base' }));
      case 'recent':
      default:
        return this.sortByRecency(ads);
    }
  }

  private parseAvailability(date: string): number {
    const parsed = new Date(date).getTime();
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  }

  private displayName(ad: RoommateAd): string {
    return ad.profile?.name?.trim() || ad.title.trim();
  }

  private collectLifestyleOptions(ads: RoommateAd[]): string[] {
    const set = new Set<string>();
    for (const ad of ads) {
      for (const style of ad.lifestyle ?? []) {
        const label = style.trim();
        if (label) {
          set.add(label);
        }
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'el', { sensitivity: 'base' }));
  }

  private setFeedback(text: string, tone: 'success' | 'error'): void {
    this.feedback = { text, tone };
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = window.setTimeout(() => {
      this.feedbackTimer = null;
      this.feedback = null;
    }, 4000);
  }

  private clearFeedback(): void {
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
    this.feedback = null;
  }
}

type RoommateSortOption = 'recent' | 'rent-asc' | 'rent-desc' | 'availability' | 'alphabetical';
type RoommateGenderFilter = '' | 'Γυναίκα' | 'Άνδρας' | 'Μη δυαδικό';
type RoommateModeFilter = '' | RoommateAdMode;
