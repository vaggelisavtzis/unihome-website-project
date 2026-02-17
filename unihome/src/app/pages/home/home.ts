import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocationPickerComponent } from '../../shared/location-picker/location-picker';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgFor, LocationPickerComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  private readonly defaultSearch: SearchCategory = 'rentals';

  readonly searchOptions: ReadonlyArray<SearchOption> = [
    {
      value: 'rentals',
      label: 'Ενοικίαση',
      hint: 'Μακροχρόνια μίσθωση κατοικίας',
      icon: 'fa-solid fa-key'
    },
    {
      value: 'temporary',
      label: 'Προσωρινή διαμονή',
      hint: 'Hostel, δωμάτια, Airbnb για λίγες μέρες',
      icon: 'fa-solid fa-suitcase-rolling'
    },
    {
      value: 'roommates',
      label: 'Συγκατοίκηση',
      hint: 'Βρες ή γίνε συγκάτοικος',
      icon: 'fa-solid fa-people-roof'
    },
    {
      value: 'sale',
      label: 'Πώληση',
      hint: 'Αγόρασε το επόμενο σπίτι σου',
      icon: 'fa-solid fa-house-circle-check'
    }
  ];

  selectedSearchType: SearchCategory = this.defaultSearch;
  searchLocation = '';
  readonly quickFilters: ReadonlyArray<QuickFilter> = [
    {
      id: 'damage-none',
      label: 'Χωρίς ζημιές',
      icon: 'fa-solid fa-shield-heart',
      query: { damage: 'no' },
      description: 'Δείχνει κατοικίες που δεν χρειάζονται εργασίες ή επισκευές.',
      appliesTo: ['rentals', 'sale']
    },
    {
      id: 'rent-negotiation',
      label: 'Προς διακανονισμό ενοικίου',
      icon: 'fa-solid fa-handshake-angle',
      query: { search: 'διακανονισμό ενοικίου' },
      description: 'Βρες αγγελίες όπου ο ιδιοκτήτης αναφέρει διακανονισμό ή ευελιξία στο μίσθωμα.',
      appliesTo: ['rentals', 'sale']
    },
    {
      id: 'furnished-yes',
      label: 'Επιπλωμένα',
      icon: 'fa-solid fa-couch',
      query: { furnished: 'yes' },
      description: 'Περιλαμβάνει μόνο διαμερίσματα έτοιμα με βασικά έπιπλα και συσκευές.',
      appliesTo: ['rentals', 'sale']
    },
    {
      id: 'furnished-no',
      label: 'Μη επιπλωμένα',
      icon: 'fa-solid fa-box-open',
      query: { furnished: 'no' },
      description: 'Φιλτράρει για χώρους χωρίς επίπλωση, ιδανικούς αν έχεις δικό σου εξοπλισμό.',
      appliesTo: ['rentals', 'sale']
    },
    {
      id: 'rooms-two-plus',
      label: '2+ δωμάτια',
      icon: 'fa-solid fa-door-open',
      query: { minRooms: '2' },
      description: 'Επιλέγει κατοικίες με τουλάχιστον δύο ανεξάρτητα υπνοδωμάτια.',
      appliesTo: ['rentals', 'sale']
    },
    {
      id: 'temporary-free',
      label: 'Φοιτητική φιλοξενία',
      icon: 'fa-solid fa-hand-holding-heart',
      query: { cost: 'free', type: 'Φιλοξενία' },
      target: 'temporary',
      description: 'Δωρεάν φιλοξενία από την κοινότητα για φοιτητές που χρειάζονται προσωρινή στέγη.',
      appliesTo: ['temporary']
    },
    {
      id: 'temporary-paid',
      label: 'Καταλύματα με χρέωση',
      icon: 'fa-solid fa-bed',
      query: { cost: 'paid' },
      target: 'temporary',
      description: 'Hostels και δωμάτια με χρέωση για βραχύβια διαμονή στη Σάμο.',
      appliesTo: ['temporary']
    }
  ];
  private readonly activeQuickFilters = new Set<string>();

  constructor(private router: Router) {
    this.startCarousel();
  }

  onSearch(): void {
    const type = this.selectedSearchType;
    const trimmedLocation = this.searchLocation.trim();
    const queryParams = this.collectQuickFilterParams(type);

    if (trimmedLocation) {
      queryParams['location'] = trimmedLocation;
    }

    if (type === 'temporary') {
      this.router.navigate(['/temporary'], {
        queryParams: Object.keys(queryParams).length ? queryParams : undefined
      });
      return;
    }

    if (type === 'roommates') {
      this.router.navigate(['/roommates'], {
        queryParams: Object.keys(queryParams).length ? queryParams : undefined
      });
      return;
    }

    if (type === 'sale') {
      queryParams['mode'] = 'sale';
      queryParams['type'] = 'Πώληση';
    }

    this.router.navigate(['/properties'], {
      queryParams: Object.keys(queryParams).length ? queryParams : undefined
    });
  }

  selectSearchType(option: SearchCategory): void {
    this.selectedSearchType = option;

    if (!this.shouldShowQuickFilters && this.activeQuickFilters.size) {
      this.activeQuickFilters.clear();
    }

    this.pruneQuickFiltersForSelectedType();
  }

  get shouldShowQuickFilters(): boolean {
    return this.visibleQuickFilters.length > 0;
  }

  get visibleQuickFilters(): ReadonlyArray<QuickFilter> {
    return this.quickFilters.filter(filter => {
      if (!filter.appliesTo || !filter.appliesTo.length) {
        return true;
      }
      return filter.appliesTo.includes(this.selectedSearchType);
    });
  }

  get activeQuickFilterDetails(): ReadonlyArray<QuickFilter> {
    return this.visibleQuickFilters.filter(filter => this.activeQuickFilters.has(filter.id));
  }

  onQuickFilter(filter: QuickFilter): void {
    if (this.activeQuickFilters.has(filter.id)) {
      this.activeQuickFilters.delete(filter.id);
      this.pruneQuickFiltersForSelectedType();
      return;
    }

    this.removeConflictingQuickFilters(filter);
    this.activeQuickFilters.add(filter.id);

    if (filter.target) {
      this.selectedSearchType = filter.target;
    } else if (!this.shouldShowQuickFilters) {
      this.selectedSearchType = 'rentals';
    }

    this.pruneQuickFiltersForSelectedType();
  }

  isQuickFilterActive(filterId: string): boolean {
    return this.activeQuickFilters.has(filterId);
  }

  onFeatureClick(feature: FeatureTarget) {
    switch (feature) {
      case 'roommates':
        this.router.navigate(['/roommates']);
        break;
      case 'temporary':
        this.router.navigate(['/temporary']);
        break;
      case 'properties/add':
        this.router.navigate(['/properties/add']);
        break;
      case 'favorites':
        this.router.navigate(['/favorites']);
        break;
      case 'contact':
        this.router.navigate(['/contact']);
        break;
    }
  }
  carouselImages = [
    'assets/carousel/1.jpg',
    'assets/carousel/2.jpg',
    'assets/carousel/3.jpg'
  ];
  currentImageIndex = 0;
  currentImage = this.carouselImages[0];
  intervalId: any;

  startCarousel() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.carouselImages.length;
      this.currentImage = this.carouselImages[this.currentImageIndex];
    }, 3500);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private collectQuickFilterParams(forType: SearchCategory): Record<string, string> {
    const params: Record<string, string> = {};

    for (const id of this.activeQuickFilters) {
      const quickFilter = this.findQuickFilter(id);
      if (!quickFilter) {
        continue;
      }
      if (quickFilter.appliesTo && !quickFilter.appliesTo.includes(forType)) {
        continue;
      }
      for (const [key, value] of Object.entries(quickFilter.query)) {
        params[key] = value;
      }
    }

    return params;
  }

  private removeConflictingQuickFilters(selected: QuickFilter): void {
    const keys = Object.keys(selected.query);
    if (!keys.length) {
      return;
    }

    for (const id of Array.from(this.activeQuickFilters)) {
      const current = this.findQuickFilter(id);
      if (!current) {
        continue;
      }
      if (current.appliesTo && !current.appliesTo.includes(this.selectedSearchType)) {
        continue;
      }

      const hasConflict = keys.some(key => key in current.query);
      if (hasConflict) {
        this.activeQuickFilters.delete(id);
      }
    }
  }

  private findQuickFilter(filterId: string): QuickFilter | undefined {
    return this.quickFilters.find(item => item.id === filterId);
  }

  private pruneQuickFiltersForSelectedType(): void {
    for (const id of Array.from(this.activeQuickFilters)) {
      const filter = this.findQuickFilter(id);
      if (!filter) {
        this.activeQuickFilters.delete(id);
        continue;
      }
      if (filter.appliesTo && !filter.appliesTo.includes(this.selectedSearchType)) {
        this.activeQuickFilters.delete(id);
      }
    }
  }
}

type SearchCategory = 'rentals' | 'temporary' | 'roommates' | 'sale';

interface SearchOption {
  value: SearchCategory;
  label: string;
  hint: string;
  icon: string;
}

type FeatureTarget = 'roommates' | 'temporary' | 'properties/add' | 'favorites' | 'contact';

interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  query: Record<string, string>;
  target?: SearchCategory;
  appliesTo?: ReadonlyArray<SearchCategory>;
  description: string;
}
