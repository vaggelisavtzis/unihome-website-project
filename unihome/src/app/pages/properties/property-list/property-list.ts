import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Property } from '../../../models/property.model';
import type { AvailabilitySummary } from '../../../models/availability.model';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';
import { PropertyFilters, PropertyService } from '../../../services/property.service';
import { LocationPickerComponent } from '../../../shared/location-picker/location-picker';
import { summarizeAvailability } from '../../../shared/availability/availability.utils';
import { PropertyMapComponent } from '../property-map/property-map';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LocationPickerComponent, PropertyMapComponent],
  templateUrl: './property-list.html',
  styleUrls: ['./property-list.scss']
})
export class PropertyListComponent implements OnInit, OnDestroy {
  formFilters = {
    type: '',
    maxPrice: null as number | null,
    location: '',
    minRooms: null as number | null,
    searchQuery: '',
    furnished: '' as '' | 'yes' | 'no',
    damage: '' as '' | 'yes' | 'no'
  };

  readonly propertyTypes = ['Διαμέρισμα', 'Γκαρσονιέρα', 'Σπίτι', 'Πώληση'];
  readonly roomCountOptions = [1, 2, 3, 4, 5, 6];
  readonly sortOptions: ReadonlyArray<{ value: PropertySortOption; label: string }> = [
    { value: 'recent', label: 'Πρόσφατες αγγελίες' },
    { value: 'price-asc', label: 'Χαμηλότερη τιμή' },
    { value: 'price-desc', label: 'Υψηλότερη τιμή' },
    { value: 'area-desc', label: 'Μεγαλύτερο εμβαδόν' },
    { value: 'rooms-desc', label: 'Περισσότερα δωμάτια' }
  ];
  selectedSort: PropertySortOption = 'recent';
  visibleProperties: Property[] = [];
  favoriteIds = new Set<string>();
  feedback: { text: string; tone: 'success' | 'error' } | null = null;
  mapHighlightId: string | null = null;
  private currentUserId: string | null = null;
  private currentUserRole: UserRole | null = null;
  isLoggedIn = false;
  private readonly subscription = new Subscription();
  private appliedFilters: PropertyFilters = {};
  private lastFilteredProperties: Property[] = [];
  private readonly visibilityRequests = new Set<string>();

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.propertyService.ensureLoaded();
    this.appliedFilters = this.buildNormalizedFilters(this.formFilters);
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        const nextFilters = { ...this.formFilters };
        let changed = false;

        const mode = params.get('mode');
        const requestedType = params.get('type');
        const resolvedType = mode === 'sale'
          ? 'Πώληση'
          : requestedType && this.propertyTypes.includes(requestedType)
            ? requestedType
            : '';

        if (resolvedType !== nextFilters.type) {
          nextFilters.type = resolvedType;
          changed = true;
        }

        const location = params.get('location') ?? '';
        if (location !== nextFilters.location) {
          nextFilters.location = location;
          changed = true;
        }

        const search = params.get('search') ?? params.get('q') ?? '';
        if (search !== nextFilters.searchQuery) {
          nextFilters.searchQuery = search;
          changed = true;
        }

        const furnished = params.get('furnished');
        const normalizedFurnished = this.normalizeToggle(furnished);
        if (normalizedFurnished !== nextFilters.furnished) {
          nextFilters.furnished = normalizedFurnished;
          changed = true;
        }

        const damage = params.get('damage');
        const normalizedDamage = this.normalizeToggle(damage);
        if (normalizedDamage !== nextFilters.damage) {
          nextFilters.damage = normalizedDamage;
          changed = true;
        }

        const minRoomsParam = params.get('minRooms');
        const normalizedMinRooms = this.normalizeNumber(
          minRoomsParam !== null ? Number(minRoomsParam) : null
        );
        const resolvedMinRooms = normalizedMinRooms ?? null;
        if (resolvedMinRooms !== nextFilters.minRooms) {
          nextFilters.minRooms = resolvedMinRooms;
          changed = true;
        }

        if (changed) {
          this.formFilters = { ...nextFilters };
          this.applyFilters();
        }
      })
    );

    this.subscription.add(
      this.propertyService.properties$.subscribe(() => {
        this.refreshVisible();
      })
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.favoriteIds = new Set(user?.favorites ?? []);
        this.currentUserId = user?.id ?? null;
        this.currentUserRole = user?.role ?? null;
        this.isLoggedIn = this.authService.isLoggedIn();
      })
    );

    const snapshot = this.authService.currentUserSnapshot();
    this.favoriteIds = new Set(snapshot?.favorites ?? []);
    this.currentUserId = snapshot?.id ?? null;
    this.currentUserRole = snapshot?.role ?? null;
    this.isLoggedIn = this.authService.isLoggedIn();

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  applyFilters(): void {
    this.appliedFilters = this.buildNormalizedFilters(this.formFilters);
    this.refreshVisible();
  }

  resetFilters(): void {
    this.formFilters = {
      type: '',
      maxPrice: null,
      location: '',
      minRooms: null,
      searchQuery: '',
      furnished: '',
      damage: ''
    };
    this.appliedFilters = {};
    this.refreshVisible();
  }

  toggleFavorite(propertyId: string): void {
    const toggleSub = this.propertyService.toggleFavorite(propertyId).subscribe({
      next: result => {
        if (!result.success) {
          this.setFeedback(result.message ?? 'Απαιτείται σύνδεση για τα αγαπημένα.', 'error');
          if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/auth/login'], {
              queryParams: { redirectTo: `/properties/${propertyId}` }
            });
          }
          return;
        }

        if (result.favorite) {
          this.favoriteIds.add(propertyId);
          this.setFeedback('Το ακίνητο προστέθηκε στα αγαπημένα σου.', 'success');
        } else {
          this.favoriteIds.delete(propertyId);
          this.setFeedback('Το ακίνητο αφαιρέθηκε από τα αγαπημένα.', 'success');
        }
      },
      error: error => {
        const message =
          (error instanceof Error ? error.message : undefined) ?? 'Δεν ήταν δυνατή η ενημέρωση των αγαπημένων.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscription.add(toggleSub);
  }

  onSortChange(option: PropertySortOption): void {
    this.selectedSort = option;
    this.visibleProperties = this.sortProperties(this.lastFilteredProperties);
  }

  isFavorite(propertyId: string): boolean {
    return this.favoriteIds.has(propertyId);
  }

  trackByProperty(_: number, property: Property): string {
    return property.id;
  }

  availabilitySummaryFor(property: Property): AvailabilitySummary {
    return summarizeAvailability(property.availability);
  }

  trackByImage(index: number, image: string): string {
    return `${index}-${image}`;
  }

  onCardHover(property: Property | null): void {
    this.mapHighlightId = property?.id ?? null;
  }

  onMapPropertyFocus(property: Property): void {
    this.mapHighlightId = property.id;
    const element = document.querySelector<HTMLElement>(this.buildCardSelector(property.id));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('is-focused-from-map');
      window.setTimeout(() => element.classList.remove('is-focused-from-map'), 2000);
    }
  }

  canDelete(property: Property): boolean {
    if (!property) {
      return false;
    }

    return this.currentUserRole === 'owner' && this.currentUserId === property.ownerId;
  }

  canToggleVisibility(property: Property): boolean {
    return this.canDelete(property);
  }

  isHidden(property: Property): boolean {
    return property.published === false;
  }

  isVisibilityPending(property: Property): boolean {
    return this.visibilityRequests.has(property.id);
  }

  toggleVisibility(property: Property): void {
    if (!this.canToggleVisibility(property)) {
      this.setFeedback('Δεν έχεις δικαίωμα διαχείρισης αυτής της αγγελίας.', 'error');
      return;
    }

    if (this.isVisibilityPending(property)) {
      return;
    }

    const hide = property.published !== false;
    const confirmed = window.confirm(
      hide
        ? `Να γίνει απόκρυψη της αγγελίας "${property.title}";`
        : `Να δημοσιευτεί ξανά η αγγελία "${property.title}";`
    );
    if (!confirmed) {
      return;
    }

    this.visibilityRequests.add(property.id);
    const request$ = (hide
      ? this.propertyService.hideProperty(property.id)
      : this.propertyService.publishProperty(property.id)
    ).pipe(finalize(() => this.visibilityRequests.delete(property.id)));

    const toggleSub = request$.subscribe({
      next: () => {
        const message = hide
          ? 'Η αγγελία τέθηκε σε απόκρυψη.'
          : 'Η αγγελία είναι ξανά δημόσια.';
        this.setFeedback(message, 'success');
        this.refreshVisible();
      },
      error: error => {
        const message =
          (error instanceof Error ? error.message : undefined) || 'Η αλλαγή ορατότητας δεν ολοκληρώθηκε.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscription.add(toggleSub);
  }

  get canCreateProperty(): boolean {
    return this.currentUserRole === 'owner';
  }

  get showPropertyCta(): boolean {
    return !this.isLoggedIn || this.canCreateProperty;
  }

  onCreateProperty(): void {
    if (this.canCreateProperty) {
      this.router.navigate(['/properties/add']);
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { role: 'owner', redirectTo: '/properties/add' }
    });
  }

  deleteProperty(property: Property): void {
    if (!this.canDelete(property)) {
      this.setFeedback('Δεν έχεις δικαίωμα διαγραφής αυτής της αγγελίας.', 'error');
      return;
    }

    const confirmed = window.confirm(`Να διαγραφεί η αγγελία "${property.title}";`);
    if (!confirmed) {
      return;
    }

    const deleteSub = this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.setFeedback('Η αγγελία διαγράφηκε με επιτυχία.', 'success');
      },
      error: error => {
        const message =
          (error instanceof Error ? error.message : undefined) ?? 'Η διαγραφή δεν ολοκληρώθηκε.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscription.add(deleteSub);
  }

  private normalizeNumber(value: number | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  private normalizeToggle(value: string | null): '' | 'yes' | 'no' {
    if (!value) {
      return '';
    }
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', '1'].includes(normalized)) {
      return 'yes';
    }
    if (['no', 'false', '0'].includes(normalized)) {
      return 'no';
    }
    return '';
  }

  private setFeedback(text: string, tone: 'success' | 'error'): void {
    this.feedback = { text, tone };
    window.setTimeout(() => this.clearFeedback(), 4000);
  }

  private clearFeedback(): void {
    this.feedback = null;
  }

  private buildNormalizedFilters(source: typeof this.formFilters): PropertyFilters {
    const furnished = source.furnished === 'yes' ? true : source.furnished === 'no' ? false : undefined;
    const hasDamage = source.damage === 'yes' ? true : source.damage === 'no' ? false : undefined;
    return {
      type: source.type || undefined,
      maxPrice: this.normalizeNumber(source.maxPrice) ?? undefined,
      minRooms: this.normalizeNumber(source.minRooms) ?? undefined,
      location: source.location.trim() || undefined,
      searchQuery: source.searchQuery.trim() || undefined,
      furnished,
      hasDamage
    };
  }

  private refreshVisible(): void {
    this.lastFilteredProperties = this.propertyService.filterProperties(this.appliedFilters);
    this.visibleProperties = this.sortProperties(this.lastFilteredProperties);
    if (this.mapHighlightId && !this.visibleProperties.some(property => property.id === this.mapHighlightId)) {
      this.mapHighlightId = null;
    }
  }

  private sortProperties(properties: Property[]): Property[] {
    const sorted = [...properties];
    switch (this.selectedSort) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'area-desc':
        return sorted.sort((a, b) => b.area - a.area);
      case 'rooms-desc':
        return sorted.sort((a, b) => b.rooms - a.rooms);
      case 'recent':
      default:
        return sorted.sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
    }
  }

  private buildCardSelector(propertyId: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return `[data-property-id="${CSS.escape(propertyId)}"]`;
    }
    const sanitized = propertyId.replace(/"/g, '\\"');
    return `[data-property-id="${sanitized}"]`;
  }
}

type PropertySortOption = 'recent' | 'price-asc' | 'price-desc' | 'area-desc' | 'rooms-desc';
