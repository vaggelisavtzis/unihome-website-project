import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RoommateService } from '../../services/roommate.service';
import { OwnerUser, StudentUser, User, isOwnerUser, isStudentUser } from '../../models/user.model';
import { Property } from '../../models/property.model';
import { RoommateAd } from '../../models/roommate.model';
import { TemporaryStay } from '../../models/temporary-stay.model';
import { PropertyService } from '../../services/property.service';
import { TemporaryService } from '../../services/temporary.service';
import { AEGEAN_SAMOS_DEPARTMENTS, AEGEAN_UNIVERSITY } from '../../shared/education-options';

interface ProfileAction {
  label: string;
  description: string;
  route: string;
  kind: 'primary' | 'secondary';
}

interface ProfileEditModel {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age: string;
  university?: string;
  department?: string;
  address?: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, DatePipe, DecimalPipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfilePage implements OnInit, OnDestroy {
  user: User | null = null;
  isMember = false;
  isUniversityStudent = false;
  isOwner = false;
  actions: ProfileAction[] = [];
  isEditing = false;
  editModel: ProfileEditModel | null = null;
  feedback: { text: string; tone: 'success' | 'error' } | null = null;
  listingsFeedback: { text: string; tone: 'success' | 'error' } | null = null;
  readonly universityOptions = [AEGEAN_UNIVERSITY];
  readonly departmentOptions = AEGEAN_SAMOS_DEPARTMENTS;
  ownerProperties: Property[] = [];
  ownerHospitalityStays: TemporaryStay[] = [];
  studentRoommateAds: RoommateAd[] = [];

  private readonly subscriptions = new Subscription();
  private feedbackTimer: number | null = null;
  private listingsFeedbackTimer: number | null = null;
  private inferredAge: number | undefined;
  private readonly visibilityRequests = new Set<string>();
  private readonly stayVisibilityRequests = new Set<string>();
  private readonly roommateVisibilityRequests = new Set<string>();

  constructor(
    private authService: AuthService,
    private roommateService: RoommateService,
    private propertyService: PropertyService,
    private temporaryService: TemporaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.captureSnapshot();
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(() => this.captureSnapshot())
    );
    this.subscriptions.add(
      this.roommateService.mineRoommateAds$.subscribe(() => this.recalculateStudentListings())
    );
    this.subscriptions.add(
      this.propertyService.properties$.subscribe(() => this.recalculateOwnerListings())
    );
    this.subscriptions.add(
      this.temporaryService.stays$.subscribe(() => this.recalculateOwnerListings())
    );
    this.subscriptions.add(
      this.temporaryService.mineStays$.subscribe(() => this.recalculateOwnerListings())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.feedbackTimer !== null) {
      window.clearTimeout(this.feedbackTimer);
    }
    if (this.listingsFeedbackTimer !== null) {
      window.clearTimeout(this.listingsFeedbackTimer);
    }
  }

  get displayName(): string {
    if (!this.user) {
      return 'Χωρίς προφίλ';
    }
    return `${this.user.firstName} ${this.user.lastName}`.trim();
  }

  get email(): string {
    return this.user?.email ?? '—';
  }

  get phone(): string {
    return this.user?.phone ?? '—';
  }

  get hasDisplayAge(): boolean {
    return this.displayAgeValue() !== undefined;
  }

  get displayAge(): string {
    const age = this.displayAgeValue();
    return age !== undefined ? String(age) : '—';
  }

  get studentProfile(): StudentUser['profile'] | null {
    return this.isUniversityStudent && this.user ? (this.user as StudentUser).profile : null;
  }

  get ownerProfile(): OwnerUser['profile'] | null {
    return this.isOwner && this.user ? (this.user as OwnerUser).profile : null;
  }

  get hasOwnerListings(): boolean {
    return this.ownerProperties.length > 0 || this.ownerHospitalityStays.length > 0;
  }

  get hasStudentListings(): boolean {
    return this.studentRoommateAds.length > 0;
  }

  get hasAnyListings(): boolean {
    return this.hasOwnerListings || this.hasStudentListings;
  }

  get shouldShowListingsCard(): boolean {
    return this.isOwner || this.isMember;
  }

  onNavigate(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  viewProperty(property: Property): void {
    this.router.navigate(['/properties', property.id]);
  }

  editProperty(property: Property): void {
    if (!this.isOwner || !this.user) {
      return;
    }
    this.router.navigate(['/properties', property.id, 'edit']);
  }

  viewTemporaryStay(stay: TemporaryStay): void {
    const queryParams = stay.location?.city
      ? { location: stay.location.city }
      : undefined;
    this.router.navigate(['/temporary'], { queryParams });
  }

  editTemporaryStay(stay: TemporaryStay): void {
    if (!this.isOwner || !this.user) {
      return;
    }
    this.router.navigate(['/temporary', stay.id, 'edit']);
  }

  viewRoommateAd(ad: RoommateAd): void {
    this.router.navigate(['/roommates', ad.id]);
  }

  deleteProperty(property: Property): void {
    if (!this.isOwner || !this.user) {
      return;
    }
    const confirmed = window.confirm(`Να διαγραφεί το ακίνητο "${property.title}";`);
    if (!confirmed) {
      return;
    }

    const deleteSub = this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.setListingsFeedback('Το ακίνητο αφαιρέθηκε από τις αγγελίες σου.', 'success');
      },
      error: error => {
        const message = (error instanceof Error ? error.message : undefined) ?? 'Η διαγραφή του ακινήτου απέτυχε.';
        this.setListingsFeedback(message, 'error');
      }
    });
    this.subscriptions.add(deleteSub);
  }

  canToggleVisibility(property: Property): boolean {
    if (!this.isOwner || !this.user) {
      return false;
    }
    return property.ownerId === this.user.id;
  }

  isHidden(property: Property): boolean {
    return property.published === false;
  }

  isVisibilityPending(property: Property): boolean {
    return this.visibilityRequests.has(property.id);
  }

  toggleVisibility(property: Property): void {
    if (!this.canToggleVisibility(property)) {
      this.setListingsFeedback('Δεν μπορείς να αλλάξεις την ορατότητα αυτής της αγγελίας.', 'error');
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
    const request$ = hide
      ? this.propertyService.hideProperty(property.id)
      : this.propertyService.publishProperty(property.id);

    const toggleSub = request$
      .pipe(finalize(() => this.visibilityRequests.delete(property.id)))
      .subscribe({
        next: () => {
          const message = hide
            ? 'Η αγγελία τέθηκε σε απόκρυψη.'
            : 'Η αγγελία είναι ξανά δημόσια.';
          this.setListingsFeedback(message, 'success');
        },
        error: error => {
          const message = (error instanceof Error ? error.message : undefined) ?? 'Η αλλαγή ορατότητας απέτυχε.';
          this.setListingsFeedback(message, 'error');
        }
      });

    this.subscriptions.add(toggleSub);
  }

  deleteTemporaryStay(stay: TemporaryStay): void {
    if (!this.isOwner || !this.user) {
      return;
    }
    const confirmed = window.confirm(`Να αφαιρεθεί η προσωρινή διαμονή "${stay.title}";`);
    if (!confirmed) {
      return;
    }

    const deleteSub = this.temporaryService.deleteStay(stay.id).subscribe({
      next: () => {
        this.setListingsFeedback('Η προσωρινή διαμονή αφαιρέθηκε.', 'success');
      },
      error: error => {
        const message = (error instanceof Error ? error.message : undefined) ?? 'Η διαγραφή της προσωρινής διαμονής απέτυχε.';
        this.setListingsFeedback(message, 'error');
      }
    });
    this.subscriptions.add(deleteSub);
  }

  deleteRoommateAd(ad: RoommateAd): void {
    if (!this.isMember || !this.user) {
      return;
    }
    const confirmed = window.confirm(`Να διαγραφεί η αγγελία "${ad.title}";`);
    if (!confirmed) {
      return;
    }

    const deleteSub = this.roommateService.removeAd(ad.id).subscribe({
      next: () => {
        this.setListingsFeedback('Η αγγελία συγκάτοικου αφαιρέθηκε.', 'success');
      },
      error: error => {
        const message = (error instanceof Error ? error.message : undefined) ?? 'Η διαγραφή της αγγελίας απέτυχε.';
        this.setListingsFeedback(message, 'error');
      }
    });
    this.subscriptions.add(deleteSub);
  }

  trackByProperty(_: number, property: Property): string {
    return property.id;
  }

  trackByStay(_: number, stay: TemporaryStay): string {
    return stay.id;
  }

  trackByRoommate(_: number, ad: RoommateAd): string {
    return ad.id;
  }

  startEdit(): void {
    if (!this.user) {
      return;
    }
    this.isEditing = true;
    this.inferredAge = this.resolveAgeFromRoommate(this.user);
    this.editModel = this.createEditModel(this.user);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.inferredAge = this.resolveAgeFromRoommate(this.user);
    this.editModel = this.createEditModel(this.user);
  }

  saveProfile(form: NgForm): void {
    if (!this.user || !this.editModel) {
      return;
    }
    if (form.invalid) {
      this.setFeedback('Έλεγξε ότι όλα τα υποχρεωτικά πεδία είναι συμπληρωμένα.', 'error');
      return;
    }

    const updatedUser = this.applyEditModel(this.user, this.editModel);
    const updateSub = this.authService.updateUser(updatedUser).subscribe({
      next: result => {
        if (!result.success) {
          this.setFeedback(result.message ?? 'Δεν ήταν δυνατή η ενημέρωση των στοιχείων.', 'error');
          return;
        }

        this.isEditing = false;
        this.captureSnapshot();
        this.setFeedback('Τα στοιχεία σου ενημερώθηκαν με επιτυχία.', 'success');
      },
      error: error => {
        const message = (error instanceof Error ? error.message : undefined) ?? 'Δεν ήταν δυνατή η ενημέρωση των στοιχείων.';
        this.setFeedback(message, 'error');
      }
    });

    this.subscriptions.add(updateSub);
  }

  private captureSnapshot(): void {
    const snapshot = this.authService.currentUserSnapshot();
    this.user = snapshot;
    this.isMember = isStudentUser(snapshot);
    this.isUniversityStudent = isStudentUser(snapshot) && snapshot.profile.isStudent !== false;
    this.isOwner = isOwnerUser(snapshot);
    this.actions = this.buildActions();
    this.inferredAge = this.resolveAgeFromRoommate(snapshot);
    if (!this.isEditing) {
      this.editModel = this.createEditModel(snapshot);
    }
    if (this.isOwner) {
      this.propertyService.ensureLoaded();
      this.temporaryService.ensureLoaded();
      this.temporaryService.refreshMine();
    }
    if (this.isMember) {
      this.roommateService.refreshMine();
    }
    this.recalculateOwnerListings();
    this.recalculateStudentListings();
  }

  private buildActions(): ProfileAction[] {
    const actions: ProfileAction[] = [];

    actions.push({
      label: 'Αγαπημένα',
      description: 'Δες τα ακίνητα και τις αγγελίες που αποθήκευσες.',
      route: '/favorites',
      kind: 'primary'
    });

    if (this.isOwner) {
      actions.push(
        {
          label: 'Καταχώρηση ακινήτου',
          description: 'Πρόσθεσε νέο ακίνητο στο Unihome.',
          route: '/properties/add',
          kind: 'primary'
        },
        {
          label: 'Περιήγηση σε ακίνητα',
          description: 'Δες όλες τις αγγελίες ακινήτων.',
          route: '/properties',
          kind: 'secondary'
        }
      );
    }

    if (this.isMember) {
      actions.push(
        {
          label: 'Καταχώρηση αγγελίας συγκάτοικου',
          description: 'Δημιούργησε ή ενημέρωσε τη δική σου αγγελία.',
          route: '/roommates/add',
          kind: 'primary'
        },
        {
          label: 'Περιήγηση σε συγκάτοικους',
          description: 'Αναζήτησε νέους συγκάτοικους μέσα από τα διαθέσιμα προφίλ.',
          route: '/roommates',
          kind: 'secondary'
        },
        {
          label: 'Προσωρινή διαμονή',
          description: 'Βρες δωμάτια και βραχυχρόνιες λύσεις.',
          route: '/temporary',
          kind: 'secondary'
        }
      );
    }

    actions.push({
      label: 'Επικοινωνία με την ομάδα',
      description: 'Χρειάζεσαι βοήθεια; Επικοινώνησε μαζί μας.',
      route: '/contact',
      kind: 'secondary'
    });

    return actions;
  }

  private createEditModel(user: User | null): ProfileEditModel | null {
    if (!user) {
      return null;
    }

    const resolvedAge = this.displayAgeValue();

    const base: ProfileEditModel = {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      age: resolvedAge !== undefined ? String(resolvedAge) : ''
    };

    if (isStudentUser(user)) {
      const currentUniversity = (user.profile.university ?? '').trim();
      const currentDepartment = (user.profile.department ?? '').trim();
      base.university = this.normalizeUniversity(currentUniversity);
      base.department = this.normalizeDepartment(currentDepartment);
    }

    if (isOwnerUser(user)) {
      base.address = user.profile.address ?? '';
    }

    return base;
  }

  private applyEditModel(user: User, model: ProfileEditModel): User {
    const trimValue = (value: unknown): string => {
      if (typeof value === 'number') {
        return String(value);
      }
      if (typeof value === 'string') {
        return value.trim();
      }
      return '';
    };
    const parsedAge = this.parseAge(model.age);
    const ageInput = trimValue(model.age);
    const emailInput = trimValue(model.email);

    const updated: User = {
      ...user,
      firstName: trimValue(model.firstName) || user.firstName,
      lastName: trimValue(model.lastName) || user.lastName,
      phone: trimValue(model.phone) || undefined,
      email: emailInput.length ? emailInput : undefined,
      age: ageInput.length === 0 ? undefined : parsedAge ?? user.age
    } as User;

    if (isStudentUser(updated)) {
      const normalizedUniversity = this.normalizeUniversity(model.university, updated.profile.university);
      const normalizedDepartment = this.normalizeDepartment(model.department, updated.profile.department);
      updated.profile = {
        ...updated.profile,
        university: normalizedUniversity,
        department: normalizedDepartment
      };
    }

    if (isOwnerUser(updated)) {
      updated.profile = {
        ...updated.profile,
        address: trimValue(model.address) || updated.profile.address
      };
    }

    return updated;
  }

  private displayAgeValue(): number | undefined {
    if (typeof this.user?.age === 'number' && Number.isFinite(this.user.age)) {
      return this.user.age;
    }
    if (typeof this.inferredAge === 'number' && Number.isFinite(this.inferredAge)) {
      return this.inferredAge;
    }
    return undefined;
  }

  private setFeedback(text: string, tone: 'success' | 'error'): void {
    this.feedback = { text, tone };
    if (this.feedbackTimer !== null) {
      window.clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = window.setTimeout(() => {
      this.feedback = null;
      this.feedbackTimer = null;
    }, 4000);
  }

  private setListingsFeedback(text: string, tone: 'success' | 'error'): void {
    this.listingsFeedback = { text, tone };
    if (this.listingsFeedbackTimer !== null) {
      window.clearTimeout(this.listingsFeedbackTimer);
    }
    this.listingsFeedbackTimer = window.setTimeout(() => {
      this.listingsFeedback = null;
      this.listingsFeedbackTimer = null;
    }, 4000);
  }

  private parseAge(value: unknown): number | undefined {
    const raw = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    const rounded = Math.round(parsed);
    if (rounded < 16 || rounded > 120) {
      return undefined;
    }
    return rounded;
  }

  private normalizeUniversity(value?: string, fallback?: string): string {
    const trimmedValue = (value ?? '').trim();
    if (trimmedValue && this.universityOptions.includes(trimmedValue)) {
      return trimmedValue;
    }
    if (fallback && this.universityOptions.includes(fallback)) {
      return fallback;
    }
    return this.universityOptions[0];
  }

  private normalizeDepartment(value?: string, fallback?: string): string {
    const trimmedValue = (value ?? '').trim();
    if (trimmedValue && this.departmentOptions.includes(trimmedValue)) {
      return trimmedValue;
    }
    if (fallback && this.departmentOptions.includes(fallback)) {
      return fallback;
    }
    return this.departmentOptions[0] ?? '';
  }

  private recalculateOwnerListings(): void {
    if (!this.isOwner || !this.user) {
      this.ownerProperties = [];
      this.ownerHospitalityStays = [];
      return;
    }

    const ownerId = this.user.id;
    const propertySnapshot = this.propertyService.getSnapshot();
    const ownerProperties = propertySnapshot
      .filter(property => property.ownerId === ownerId)
      .sort((a, b) => this.compareByDateDesc(a.createdAt, b.createdAt));
    this.ownerProperties = ownerProperties;

    const staySnapshot = this.temporaryService.getMineSnapshot();
    const ownerStays = staySnapshot
      .filter(stay => !!stay)
      .sort((a, b) => this.compareByDateDesc(a.createdAt, b.createdAt));
    this.ownerHospitalityStays = ownerStays;
  }

  private recalculateStudentListings(): void {
    if (!this.isMember || !this.user) {
      this.studentRoommateAds = [];
      return;
    }

    const userId = this.user.id;
    const ads = this.roommateService
      .getMineAds()
      .filter(ad => ad.authorId === userId)
      .sort((a, b) => this.compareByDateDesc(a.createdAt, b.createdAt));
    this.studentRoommateAds = ads;
  }

  canToggleRoommateVisibility(ad: RoommateAd): boolean {
    return this.isMember && !!this.user;
  }

  isRoommateHidden(ad: RoommateAd): boolean {
    return ad.published === false;
  }

  isRoommateVisibilityPending(ad: RoommateAd): boolean {
    return this.roommateVisibilityRequests.has(ad.id);
  }

  toggleRoommateVisibility(ad: RoommateAd): void {
    if (!this.canToggleRoommateVisibility(ad)) {
      this.setListingsFeedback('Δεν μπορείς να αλλάξεις την ορατότητα αυτής της αγγελίας.', 'error');
      return;
    }

    if (this.isRoommateVisibilityPending(ad)) {
      return;
    }

    const hide = ad.published !== false;
    const confirmed = window.confirm(
      hide
        ? `Να γίνει απόκρυψη της αγγελίας "${ad.title}";`
        : `Να δημοσιευτεί ξανά η αγγελία "${ad.title}";`
    );
    if (!confirmed) {
      return;
    }

    this.roommateVisibilityRequests.add(ad.id);
    const request$ = hide
      ? this.roommateService.hideAd(ad.id)
      : this.roommateService.publishAd(ad.id);

    const toggleSub = request$
      .pipe(finalize(() => this.roommateVisibilityRequests.delete(ad.id)))
      .subscribe({
        next: () => {
          this.setListingsFeedback(
            hide ? 'Η αγγελία αποκρύφτηκε.' : 'Η αγγελία δημοσιεύθηκε ξανά.',
            'success'
          );
        },
        error: () => {
          this.setListingsFeedback('Δεν ήταν δυνατή η ενημέρωση της αγγελίας.', 'error');
        }
      });

    this.subscriptions.add(toggleSub);
  }

  editRoommateAd(ad: RoommateAd): void {
    this.router.navigate(['/roommates', ad.id, 'edit']);
  }

  canToggleStayVisibility(stay: TemporaryStay): boolean {
    return this.isOwner && !!this.user;
  }

  isStayHidden(stay: TemporaryStay): boolean {
    return stay.published === false;
  }

  isStayVisibilityPending(stay: TemporaryStay): boolean {
    return this.stayVisibilityRequests.has(stay.id);
  }

  toggleStayVisibility(stay: TemporaryStay): void {
    if (!this.canToggleStayVisibility(stay)) {
      this.setListingsFeedback('Δεν μπορείς να αλλάξεις την ορατότητα αυτής της αγγελίας.', 'error');
      return;
    }

    if (this.isStayVisibilityPending(stay)) {
      return;
    }

    const hide = stay.published !== false;
    const confirmed = window.confirm(
      hide
        ? `Να γίνει απόκρυψη της αγγελίας "${stay.title}";`
        : `Να δημοσιευτεί ξανά η αγγελία "${stay.title}";`
    );
    if (!confirmed) {
      return;
    }

    this.stayVisibilityRequests.add(stay.id);
    const request$ = hide
      ? this.temporaryService.hideStay(stay.id)
      : this.temporaryService.publishStay(stay.id);

    const toggleSub = request$
      .pipe(finalize(() => this.stayVisibilityRequests.delete(stay.id)))
      .subscribe({
        next: () => {
          const message = hide
            ? 'Η αγγελία τέθηκε σε απόκρυψη.'
            : 'Η αγγελία είναι ξανά δημόσια.';
          this.setListingsFeedback(message, 'success');
          this.temporaryService.refreshMine();
        },
        error: error => {
          const message = (error instanceof Error ? error.message : undefined) ?? 'Η αλλαγή ορατότητας απέτυχε.';
          this.setListingsFeedback(message, 'error');
        }
      });

    this.subscriptions.add(toggleSub);
  }

  private compareByDateDesc(a: string | undefined, b: string | undefined): number {
    const aTime = a ? new Date(a).getTime() : 0;
    const bTime = b ? new Date(b).getTime() : 0;
    return bTime - aTime;
  }

  private resolveAgeFromRoommate(user: User | null): number | undefined {
    if (!user) {
      return undefined;
    }

    let latestTimestamp = Number.NEGATIVE_INFINITY;
    let resolvedAge: number | undefined;

    for (const ad of this.roommateService.getAds()) {
      if (ad.authorId !== user.id) {
        continue;
      }
      const candidateAge = ad.profile?.age;
      if (typeof candidateAge !== 'number' || !Number.isFinite(candidateAge)) {
        continue;
      }
      const createdAtTime = new Date(ad.createdAt ?? 0).getTime();
      if (!Number.isFinite(createdAtTime)) {
        continue;
      }
      if (createdAtTime > latestTimestamp) {
        latestTimestamp = createdAtTime;
        resolvedAge = candidateAge;
      }
    }

    return resolvedAge;
  }
}
