import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TemporaryService, TemporaryStayFilters } from '../../services/temporary.service';
import { TemporaryStay, TemporaryStayType, TemporaryStayCostCategory } from '../../models/temporary-stay.model';
import { LocationPickerComponent } from '../../shared/location-picker/location-picker';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-temporary',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, NgForOf, RouterLink, LocationPickerComponent],
  templateUrl: './temporary.html',
  styleUrl: './temporary.scss'
})
export class Temporary implements OnInit, OnDestroy {
  formFilters = {
    type: '' as TemporaryStayType | '',
    maxPrice: null as number | null,
    location: '',
    cost: '' as TemporaryStayCostCategory | ''
  };

  readonly stayTypes: TemporaryStayType[] = ['Δωμάτιο', 'Ξενοδοχείο', 'Airbnb', 'Hostel', 'Φιλοξενία'];
  readonly costOptions: ReadonlyArray<{ value: TemporaryStayCostCategory; label: string }> = [
    { value: 'free', label: 'Δωρεάν φιλοξενία' },
    { value: 'paid', label: 'Με χρέωση' }
  ];
  readonly sortOptions: ReadonlyArray<{ value: TemporarySortOption; label: string }> = [
    { value: 'recent', label: 'Πρόσφατες καταχωρήσεις' },
    { value: 'price-asc', label: 'Χαμηλότερο κόστος' },
    { value: 'price-desc', label: 'Υψηλότερο κόστος' },
    { value: 'nights-asc', label: 'Λιγότερες απαιτούμενες νύχτες' },
    { value: 'title', label: 'Αλφαβητικά' }
  ];
  selectedSort: TemporarySortOption = 'recent';
  visibleStays: TemporaryStay[] = [];
  isLoggedIn = false;

  private readonly subscription = new Subscription();
  private appliedFilters: TemporaryStayFilters = {};
  private lastFilteredStays: TemporaryStay[] = [];
  private currentUserRole: UserRole | null = null;

  constructor(
    private temporaryService: TemporaryService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.temporaryService.ensureLoaded();
    this.appliedFilters = this.buildNormalizedFilters(this.formFilters);
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        const nextFilters = { ...this.formFilters };
        let changed = false;

        const typeParam = params.get('type') as TemporaryStayType | '' | null;
        const normalizedType = typeParam && this.stayTypes.includes(typeParam as TemporaryStayType)
          ? (typeParam as TemporaryStayType)
          : '';
        if (normalizedType !== nextFilters.type) {
          nextFilters.type = normalizedType;
          changed = true;
        }

        const maxPriceParam = params.get('maxPrice');
        const normalizedMaxPrice = maxPriceParam && maxPriceParam.trim() !== ''
          ? Number(maxPriceParam)
          : null;
        if ((normalizedMaxPrice === null || !Number.isNaN(normalizedMaxPrice)) && normalizedMaxPrice !== nextFilters.maxPrice) {
          nextFilters.maxPrice = normalizedMaxPrice;
          changed = true;
        }

        const locationParam = params.get('location') ?? '';
        if (locationParam !== nextFilters.location) {
          nextFilters.location = locationParam;
          changed = true;
        }

        const costParam = this.normalizeCostParam(params.get('cost'));
        if (costParam !== nextFilters.cost) {
          nextFilters.cost = costParam;
          changed = true;
        }

        if (changed) {
          this.formFilters = { ...nextFilters };
          this.applyFilters();
        }
      })
    );

    this.subscription.add(
      this.temporaryService.stays$.subscribe(() => {
        this.refreshVisible();
      })
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUserRole = user?.role ?? null;
        this.captureAuthState();
        this.applyFilters();
      })
    );

    this.captureAuthState();
    this.applyFilters();
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
      type: '' as TemporaryStayType | '',
      maxPrice: null,
      location: '',
      cost: ''
    };
    this.applyFilters();
  }

  onSortChange(option: TemporarySortOption): void {
    this.selectedSort = option;
    this.visibleStays = this.sortStays(this.lastFilteredStays);
  }

  formatPrice(stay: TemporaryStay): string {
    if (stay.costCategory === 'free') {
      return 'Δωρεάν φιλοξενία';
    }
    return `${stay.pricePerNight.toLocaleString('el-GR')} € / βραδιά`;
  }

  mapLinkFor(stay: TemporaryStay): string {
    if (stay.location.lat && stay.location.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${stay.location.lat},${stay.location.lng}`;
    }
    const query = encodeURIComponent(`${stay.location.address}, ${stay.location.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  trackByStay(_: number, stay: TemporaryStay): string {
    return stay.id;
  }

  get canCreateStay(): boolean {
    return this.currentUserRole === 'owner';
  }

  private captureAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    const snapshot = this.authService.currentUserSnapshot();
    this.currentUserRole = snapshot?.role ?? null;
  }

  private normalizeNumber(value: number | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private buildNormalizedFilters(filters: typeof this.formFilters): TemporaryStayFilters {
    return {
      type: filters.type || undefined,
      maxPrice: this.normalizeNumber(filters.maxPrice) ?? undefined,
      location: filters.location.trim() || undefined,
      costCategory: filters.cost || undefined
    };
  }

  private refreshVisible(): void {
    this.lastFilteredStays = this.temporaryService.filterStays(this.appliedFilters);
    this.visibleStays = this.sortStays(this.lastFilteredStays);
  }

  private normalizeCostParam(value: string | null): TemporaryStayCostCategory | '' {
    if (!value) {
      return '';
    }

    return value === 'free' || value === 'paid' ? value : '';
  }

  private sortStays(stays: TemporaryStay[]): TemporaryStay[] {
    const sorted = [...stays];
    switch (this.selectedSort) {
      case 'price-asc':
        return sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case 'price-desc':
        return sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
      case 'nights-asc':
        return sorted.sort((a, b) => a.minNights - b.minNights);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title, 'el', { sensitivity: 'base' }));
      case 'recent':
      default:
        return sorted.sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
    }
  }
}

type TemporarySortOption = 'recent' | 'price-asc' | 'price-desc' | 'nights-asc' | 'title';
