import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Property } from '../../../models/property.model';
import { AuthService } from '../../../services/auth.service';
import { PropertyService } from '../../../services/property.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor],
  templateUrl: './property-details.html',
  styleUrls: ['./property-details.scss']
})
export class PropertyDetailsComponent implements OnInit, OnDestroy {
  property: Property | null = null;
  heroImage: string | null = null;
  gallery: string[] = [];
  isLoggedIn = false;
  isFavorite = false;
  mapUrl: SafeResourceUrl | null = null;
  feedback: { text: string; tone: 'success' | 'error' } | null = null;

  private readonly subscription = new Subscription();
  private activePropertyId: string | null = null;
  private feedbackTimer: number | null = null;
  private currentUserId: string | null = null;
  private currentUserRole: UserRole | null = null;
  private isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.propertyService.ensureLoaded();
    this.subscription.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.navigateBack();
          return;
        }
        if (id !== this.activePropertyId) {
          this.activePropertyId = id;
          this.resolveProperty(id);
        }
      })
    );

    this.subscription.add(
      this.propertyService.properties$.subscribe(() => {
        if (this.activePropertyId) {
          this.resolveProperty(this.activePropertyId);
        }
      })
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(() => this.captureAuthState())
    );

    
    this.captureAuthState();
    const initialId = this.route.snapshot.paramMap.get('id');
    if (initialId) {
      this.activePropertyId = initialId;
      this.resolveProperty(initialId);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  selectImage(image: string): void {
    this.heroImage = image;
    this.gallery = this.property?.images.filter(src => src !== image) ?? [];
  }

  get displayFeatures(): string[] {
    if (!this.property) {
      return [];
    }

    const features = Array.isArray(this.property.features) ? [...this.property.features] : [];
    const basics = this.property.basics;
    if (basics?.furnished) {
      features.push('Επιπλωμένο');
    } else if (basics) {
      features.push('Μη επιπλωμένο');
    }

    if (basics?.hasDamage) {
      features.push('Χρειάζεται επισκευή');
    } else if (basics) {
      features.push('Χωρίς ζημιές');
    }

    return Array.from(new Set(features.map(value => value.trim()).filter(Boolean)));
  }

  toggleFavorite(): void {
    if (!this.property) {
      return;
    }

    const propertyId = this.property.id;
    const toggleSub = this.propertyService.toggleFavorite(propertyId).subscribe({
      next: result => {
        if (!result.success) {
          this.setFeedback(result.message ?? 'Πρέπει να συνδεθείς για να αποθηκεύσεις αγαπημένα.', 'error');
          if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/auth/login'], {
              queryParams: { redirectTo: `/properties/${propertyId}` }
            });
          }
          return;
        }

        this.isFavorite = result.favorite;
        const message = result.favorite
          ? 'Το ακίνητο προστέθηκε στα αγαπημένα σου.'
          : 'Το ακίνητο αφαιρέθηκε από τα αγαπημένα.';
        this.setFeedback(message, 'success');
      },
      error: error => {
        const message =
          (error instanceof Error ? error.message : undefined) ?? 'Δεν ήταν δυνατή η ενημέρωση των αγαπημένων.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscription.add(toggleSub);
  }

  navigateBack(): void {
    this.router.navigate(['/properties']);
  }

  canDeleteProperty(): boolean {
    if (!this.property) {
      return false;
    }

    return this.currentUserRole === 'owner' && this.currentUserId === this.property.ownerId;
  }

  deleteProperty(): void {
    if (!this.property) {
      return;
    }

    if (!this.canDeleteProperty()) {
      this.setFeedback('Δεν έχεις δικαίωμα διαγραφής αυτής της αγγελίας.', 'error');
      return;
    }

    if (this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(`Να διαγραφεί η αγγελία "${this.property.title}";`);
    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    const targetId = this.property.id;
    this.propertyService.deleteProperty(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.setFeedback('Η αγγελία διαγράφηκε με επιτυχία.', 'success');
        this.navigateBack();
      },
      error: error => {
        this.isDeleting = false;
        const message =
          (error instanceof Error ? error.message : undefined) ?? 'Η διαγραφή δεν ολοκληρώθηκε.';
        this.setFeedback(message, 'error');
      }
    });
  }

  private resolveProperty(id: string): void {
    const property = this.propertyService.getPropertyById(id);
    if (!property) {
      this.property = null;
      this.heroImage = null;
      this.gallery = [];
      this.mapUrl = null;
      this.isFavorite = false;
      return;
    }

    this.property = property;
    this.heroImage = property.images?.[0] ?? null;
    this.gallery = property.images?.slice(1) ?? [];
    this.mapUrl = this.buildMapUrl(property);
    this.syncFavoriteState();
  }

  private captureAuthState(): void {
    const user = this.authService.currentUserSnapshot();
    this.currentUserId = user?.id ?? null;
    this.currentUserRole = user?.role ?? null;
    this.isLoggedIn = this.authService.isLoggedIn();
    this.syncFavoriteState();
  }

  private syncFavoriteState(): void {
    if (!this.property) {
      this.isFavorite = false;
      return;
    }

    const user = this.authService.currentUserSnapshot();
    this.isFavorite = !!user && user.favorites.includes(this.property.id);
  }

  private buildMapUrl(property: Property): SafeResourceUrl | null {
    const { location } = property;
    if (!location) {
      return null;
    }

    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    const query = encodeURIComponent(`${location.address}, ${location.city}`);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private setFeedback(text: string, tone: 'success' | 'error'): void {
    this.feedback = { text, tone };
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = window.setTimeout(() => {
      this.feedback = null;
      this.feedbackTimer = null;
    }, 4000);
  }
}
