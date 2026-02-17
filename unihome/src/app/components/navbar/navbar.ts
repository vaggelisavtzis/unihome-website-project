import { CommonModule, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnDestroy {
  showUserMenu = false;
  private subscription = new Subscription();
  currentUser: User | null = null;

  constructor(private router: Router, private authService: AuthService) {
    this.subscription.add(
      this.authService.currentUser$.subscribe(() => {
        this.refreshSnapshot();
      })
    );

    this.refreshSnapshot();
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get displayName(): string {
    if (!this.currentUser) {
      return 'Λογαριασμός';
    }
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.router.navigate(['/']);
  }

  onFavorites(): void {
    this.showUserMenu = false;
    if (this.isLoggedIn) {
      this.router.navigate(['/favorites']);
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: '/favorites' }
    });
  }

  onProfile(): void {
    this.showUserMenu = false;
    if (this.isLoggedIn) {
      this.router.navigate(['/profile']);
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: '/profile' }
    });
  }

  onPropertiesLink(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/properties']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private refreshSnapshot(): void {
    const snapshot = this.authService.currentUserSnapshot();
    this.currentUser = snapshot;
    if (!snapshot) {
      this.showUserMenu = false;
    }
  }
}
