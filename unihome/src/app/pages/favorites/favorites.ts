import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Property } from '../../models/property.model';
import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor],
  templateUrl: './favorites.html',
  styleUrls: ['./favorites.scss']
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: Property[] = [];
  feedback: { text: string; tone: 'success' | 'error' } | null = null;
  private readonly subscription = new Subscription();
  private feedbackTimer: number | null = null;

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.propertyService.properties$.subscribe(() => this.refreshFavorites())
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (!user) {
          this.favorites = [];
        } else {
          this.refreshFavorites();
        }
      })
    );

    this.refreshFavorites();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  removeFavorite(propertyId: string): void {
    const toggleSub = this.propertyService.toggleFavorite(propertyId).subscribe({
      next: result => {
        if (!result.success) {
          this.setFeedback(result.message ?? 'Απαιτείται σύνδεση για διαχείριση αγαπημένων.', 'error');
          if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/auth/login'], {
              queryParams: { redirectTo: '/favorites' }
            });
          }
          return;
        }

        this.favorites = this.favorites.filter(property => property.id !== propertyId);
        this.setFeedback('Το ακίνητο αφαιρέθηκε από τα αγαπημένα σου.', 'success');
      },
      error: error => {
        const message =
          (error instanceof Error ? error.message : undefined) ?? 'Δεν ήταν δυνατή η ενημέρωση των αγαπημένων.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscription.add(toggleSub);
  }

  trackByProperty(_: number, property: Property): string {
    return property.id;
  }

  private refreshFavorites(): void {
    if (!this.authService.isLoggedIn()) {
      this.favorites = [];
      return;
    }
    this.favorites = this.propertyService.getFavoriteProperties();
  }

  private setFeedback(text: string, tone: 'success' | 'error'): void {
    this.feedback = { text, tone };
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = window.setTimeout(() => {
      this.feedback = null;
      this.feedbackTimer = null;
    }, 3500);
  }
}
