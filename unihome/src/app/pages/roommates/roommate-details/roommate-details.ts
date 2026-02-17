import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { RoommateAd, RoommateAdMode, RoommateRating } from '../../../models/roommate.model';
import { RoommateService } from '../../../services/roommate.service';
import { AuthService } from '../../../services/auth.service';
import { StudentUser, UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-roommate-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIf, NgForOf, NgFor],
  templateUrl: './roommate-details.html',
  styleUrls: ['./roommate-details.scss']
})
export class RoommateDetailsComponent implements OnInit, OnDestroy {
  roommate?: RoommateAd;
  similarAds: RoommateAd[] = [];
  isLoggedIn = false;
  notFound = false;
  ratingValue: number | null = null;
  ratingComment = '';
  ratingError?: string;
  ratingMessage?: string;
  userRating?: RoommateRating;
  readonly ratingOptions = [1, 2, 3, 4, 5];
  readonly ratingCommentLimit = 480;

  private readonly subscription = new Subscription();
  currentUserId?: string;
  private isStudentReviewer = false;
  private currentUserRole: UserRole | undefined;
  private isDeleting = false;
  private isRatingSubmitting = false;
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
    private route: ActivatedRoute,
    private router: Router,
    private roommateService: RoommateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.roommateService.ensureLoaded();

    this.subscription.add(
      combineLatest([this.route.paramMap, this.roommateService.roommateAds$]).subscribe(([params, ads]) => {
        const id = params.get('id');
        if (!id) {
          this.flagNotFound();
          return;
        }

        this.roommateService.ensureAdLoaded(id);

        const match = ads.find(ad => ad.id === id);
        if (!match) {
          this.flagNotFound();
          return;
        }

        this.notFound = false;
        this.roommate = match;
        this.similarAds = this.resolveSimilar(ads, match.id);
        this.syncRatingState(match);
      })
    );

    this.subscription.add(this.authService.currentUser$.subscribe(() => this.captureAuthState()));
    this.captureAuthState();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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

  postedAgo(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Αναρτήθηκε σήμερα';
    }
    if (diffDays === 1) {
      return 'Αναρτήθηκε πριν 1 ημέρα';
    }
    if (diffDays < 7) {
      return `Αναρτήθηκε πριν ${diffDays} ημέρες`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) {
      return 'Αναρτήθηκε πριν 1 εβδομάδα';
    }
    return `Αναρτήθηκε πριν ${diffWeeks} εβδομάδες`;
  }

  avatarFor(ad: RoommateAd | undefined): string | null {
    if (!ad) {
      return null;
    }
    return ad.profile?.avatar || ad.images?.[0] || null;
  }

  initialsFor(ad: RoommateAd | undefined): string {
    if (!ad) {
      return 'U';
    }
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

  hasDistinctBio(ad: RoommateAd): boolean {
    const description = ad.description?.trim().toLowerCase() ?? '';
    const bio = ad.profile?.bio?.trim().toLowerCase() ?? '';
    return Boolean(bio && bio !== description);
  }

  canRate(): boolean {
    if (!this.roommate) {
      return false;
    }
    if (!this.currentUserId) {
      return false;
    }
    if (this.roommate.authorId === this.currentUserId) {
      return false;
    }
    return this.isStudentReviewer;
  }

  ratingRestrictionMessage(): string {
    if (!this.roommate) {
      return 'Η αξιολόγηση δεν είναι διαθέσιμη αυτή τη στιγμή.';
    }
    if (!this.currentUserId) {
      return 'Συνδέσου ως μέλος για να αφήσεις αξιολόγηση.';
    }
    if (this.roommate.authorId === this.currentUserId) {
      return 'Δεν μπορείς να αξιολογήσεις τη δική σου αγγελία.';
    }
    return 'Μόνο προφίλ μελών με ενεργό λογαριασμό μπορούν να αφήσουν αξιολογήσεις.';
  }

  setRating(value: number): void {
    if (value < 1 || value > 5) {
      return;
    }
    this.ratingValue = value;
    this.ratingError = undefined;
    this.ratingMessage = undefined;
  }

  onSubmitRating(): void {
    if (!this.roommate) {
      return;
    }

    const score = Number(this.ratingValue);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      this.ratingError = 'Επίλεξε βαθμολογία από 1 έως 5 αστέρια.';
      this.ratingMessage = undefined;
      return;
    }

    this.ratingComment = this.ratingComment.trim();
    if (this.ratingComment.length > this.ratingCommentLimit) {
      this.ratingComment = this.ratingComment.slice(0, this.ratingCommentLimit);
    }

    if (this.isRatingSubmitting) {
      return;
    }

    this.isRatingSubmitting = true;

    this.roommateService.rateAd(this.roommate.id, score, this.ratingComment).subscribe({
      next: () => {
        this.isRatingSubmitting = false;
        this.ratingError = undefined;
        this.ratingMessage = 'Η αξιολόγηση καταχωρήθηκε.';
      },
      error: error => {
        this.isRatingSubmitting = false;
        this.ratingError = error instanceof Error
          ? error.message
          : 'Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης.';
        this.ratingMessage = undefined;
      }
    });
  }

  formatReviewDate(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const today = new Date();
    const diffDays = Math.floor((today.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Σήμερα';
    }
    if (diffDays === 1) {
      return 'Χθες';
    }
    if (diffDays < 7) {
      return `πριν ${diffDays} ημέρες`;
    }
    return new Intl.DateTimeFormat('el-GR', {
      day: 'numeric',
      month: 'long'
    }).format(parsed);
  }

  onLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { role: 'student', redirectTo: this.router.url }
    });
  }

  onPostRoommate(): void {
    const user = this.authService.currentUserSnapshot();
    const studentProfile = user?.role === 'student'
      ? (user as StudentUser).profile.isStudent !== false
      : false;
    if (studentProfile) {
      this.router.navigate(['/roommates/add']);
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { role: 'student', redirectTo: '/roommates/add' }
    });
  }

  trackBySimilar(_: number, ad: RoommateAd): string {
    return ad.id;
  }

  canDeleteAd(): boolean {
    if (!this.roommate) {
      return false;
    }

    return this.isStudentReviewer && this.currentUserId === this.roommate.authorId;
  }

  onDeleteAd(): void {
    if (!this.roommate) {
      return;
    }

    if (!this.canDeleteAd()) {
      this.ratingError = 'Δεν έχεις δικαίωμα διαγραφής αυτής της αγγελίας.';
      this.ratingMessage = undefined;
      return;
    }

    if (this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(`Να διαγραφεί η αγγελία "${this.roommate.title}";`);
    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    const targetId = this.roommate.id;
    this.roommateService.removeAd(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.router.navigate(['/roommates']);
      },
      error: error => {
        this.isDeleting = false;
        this.ratingError = error instanceof Error
          ? error.message
          : 'Η διαγραφή δεν ολοκληρώθηκε.';
        this.ratingMessage = undefined;
      }
    });
  }

  private captureAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    const user = this.authService.currentUserSnapshot();
    this.currentUserId = user?.id ?? undefined;
    this.currentUserRole = user?.role;
    this.isStudentReviewer = !!user && user.role === 'student'
      ? (user as StudentUser).profile.isStudent !== false
      : false;
    this.syncRatingState();
  }

  private flagNotFound(): void {
    this.notFound = true;
    this.roommate = undefined;
    this.similarAds = [];
    this.ratingValue = null;
    this.ratingComment = '';
    this.ratingMessage = undefined;
    this.ratingError = undefined;
    this.userRating = undefined;
  }

  private resolveSimilar(ads: RoommateAd[], excludeId: string): RoommateAd[] {
    const reference = this.roommate;
    const candidates = ads.filter(ad => ad.id !== excludeId);
    if (!reference) {
      return candidates.slice(0, 3);
    }

    return candidates
      .map(candidate => ({ candidate, score: this.similarityScore(candidate, reference) }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aTime = new Date(a.candidate.createdAt ?? a.candidate.availableFrom).getTime();
        const bTime = new Date(b.candidate.createdAt ?? b.candidate.availableFrom).getTime();
        return bTime - aTime;
      })
      .slice(0, 3)
      .map(entry => entry.candidate);
  }

  private similarityScore(candidate: RoommateAd, reference: RoommateAd): number {
    let score = 0;

    const candidateCity = candidate.location?.city?.toLowerCase() ?? candidate.propertyLocation?.toLowerCase() ?? '';
    const referenceCity = reference.location?.city?.toLowerCase() ?? reference.propertyLocation?.toLowerCase() ?? '';
    if (candidateCity && referenceCity && candidateCity === referenceCity) {
      score += 3;
    }

    const candidateUni = candidate.profile?.university?.toLowerCase() ?? '';
    const referenceUni = reference.profile?.university?.toLowerCase() ?? '';
    if (candidateUni && referenceUni && candidateUni === referenceUni) {
      score += 2.5;
    }

    const candidateLifestyle = new Set((candidate.lifestyle ?? []).map(item => item.toLowerCase()));
    const referenceLifestyle = (reference.lifestyle ?? []).map(item => item.toLowerCase());
    const sharedLifestyle = referenceLifestyle.filter(item => candidateLifestyle.has(item)).length;
    score += sharedLifestyle * 0.8;

    const rentDiff = Math.abs(candidate.monthlyRent - reference.monthlyRent);
    if (rentDiff <= 20) {
      score += 1.2;
    } else if (rentDiff <= 50) {
      score += 0.8;
    } else if (rentDiff <= 80) {
      score += 0.4;
    }

    return score;
  }

  private syncRatingState(ad?: RoommateAd): void {
    const target = ad ?? this.roommate;
    if (!target || !this.currentUserId) {
      this.userRating = undefined;
      this.ratingValue = null;
      if (!this.currentUserId) {
        this.ratingComment = '';
      }
      return;
    }

    const existing = (target.ratings ?? []).find(entry => entry.reviewerId === this.currentUserId);
    this.userRating = existing;
    this.ratingValue = existing?.score ?? null;
    this.ratingComment = existing?.comment ?? '';
  }
}
