import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoommateService, RoommateAdPayload } from '../../../services/roommate.service';
import { RoommateAd, RoommateAdMode } from '../../../models/roommate.model';
import { AuthService } from '../../../services/auth.service';
import { User, isStudentUser } from '../../../models/user.model';
import { AEGEAN_SAMOS_DEPARTMENTS, AEGEAN_UNIVERSITY } from '../../../shared/education-options';
import { UploadService } from '../../../services/upload.service';
import { Subscription, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

type SelectionKind = 'lifestyle' | 'preferences' | 'features' | 'amenities';

@Component({
  selector: 'app-add-roommate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgForOf],
  templateUrl: './add-roommate.html',
  styleUrls: ['./add-roommate.scss']
})
export class AddRoommateComponent implements OnInit, OnDestroy {
  readonly genderOptions = ['Γυναίκα', 'Άνδρας', 'Μη δυαδικό', 'Άλλο'];
  readonly adModeOptions: Array<{ value: RoommateAdMode; title: string; description: string }> = [
    {
      value: 'HOST_SEEKING_ROOMMATE',
      title: 'Έχω ήδη σπίτι',
      description: 'Διαθέτεις σπίτι και θες συγκάτοικο για να μοιραστείτε τον χώρο και τα έξοδα.'
    },
    {
      value: 'FINDING_HOME_WITH_ROOMMATE',
      title: 'Θα βρούμε σπίτι μαζί',
      description: 'Δεν έχεις ακόμα σπίτι και ψάχνεις συγκάτοικο για να το βρείτε μαζί.'
    },
    {
      value: 'LOOKING_FOR_ROOM',
      title: 'Ψάχνω συγκάτοικο με σπίτι',
      description: 'Αναζητάς κάποιον που ήδη διαθέτει χώρο ή δωμάτιο για να φιλοξενήσει.'
    }
  ];
  readonly lifestyleOptions = [
    'Ήσυχη',
    'Κοινωνικός',
    'Μη καπνιστής/στρια',
    'Φιλικός προς κατοικίδια',
    'Πρωινός τύπος',
    'Μελέτη στο σπίτι'
  ];
  readonly preferenceOptions = [
    'Καθαριότητα',
    'Σεβασμός ωρών ησυχίας',
    'Ανοιχτή επικοινωνία',
    'Αγάπη για τα ζώα',
    'Κοινές εξόδοι',
    'Μοιρασμένες δουλειές'
  ];
  readonly featureOptions = [
    'Wi-Fi 200Mbps',
    'Κεντρική θέρμανση',
    'Κλιματισμός',
    'Smart TV',
    'Μπαλκόνι με θέα',
    'Αυτόνομη θέρμανση',
    'Γκαράζ ποδηλάτων',
    'Μεγάλη κουζίνα'
  ];
  readonly amenityOptions = [
    'Πλυντήριο ρούχων',
    'Συσκευές κουζίνας',
    'Γρήγορο Wi-Fi',
    'Αποθήκη',
    'BBQ',
    'Κοινόχρηστη αυλή'
  ];
  readonly universityOptions = [AEGEAN_UNIVERSITY];
  readonly departmentOptions = AEGEAN_SAMOS_DEPARTMENTS;

  form = {
    mode: 'HOST_SEEKING_ROOMMATE' as RoommateAdMode,
    title: '',
    monthlyRent: null as number | null,
    availableFrom: '',
    propertyLocation: '',
    description: '',
    bio: '',
    locationCity: '',
    locationArea: '',
    locationProximity: '',
    interestsInput: '',
    habitsInput: '',
    profile: {
      name: '',
      age: null as number | null,
      gender: '',
      university: AEGEAN_UNIVERSITY,
      department: AEGEAN_SAMOS_DEPARTMENTS[0] ?? '',
      semester: ''
    }
  };

  contact = {
    name: '',
    phone: '',
    email: '',
    instagram: '',
    facebook: ''
  };

  customInputs: Record<SelectionKind, string> = {
    lifestyle: '',
    preferences: '',
    features: '',
    amenities: ''
  };

  selectedLifestyle: string[] = [];
  selectedPreferences: string[] = [];
  selectedFeatures: string[] = [];
  selectedAmenities: string[] = [];

  submissionError?: string;
  submissionSuccess?: string;
  isSubmitting = false;
  selectedFiles: File[] = [];
  existingImages: string[] = [];
  imageError = '';
  titleManuallyEdited = false;
  isEditMode = false;
  private editingAdId: string | null = null;
  private hasPrefilledForm = false;
  private readonly subscriptions = new Subscription();

  private lastGeneratedTitle = '';

  constructor(
    private roommateService: RoommateService,
    private authService: AuthService,
    private router: Router,
    private uploadService: UploadService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.prefillFromProfile();
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (!this.isEditMode) {
          this.applyUserDefaults(user ?? null);
        }
      })
    );
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const adId = params.get('id');
        if (adId) {
          this.enterEditMode(adId);
        } else {
          this.resetToCreateMode();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get badgeLabel(): string {
    return this.isEditMode ? 'Επεξεργασία' : 'Νέα αγγελία';
  }

  get heading(): string {
    return this.isEditMode
      ? 'Επεξεργασία αγγελίας συγκάτοικου'
      : 'Δημιούργησε αγγελία συγκάτοικου';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Αποθήκευση αλλαγών' : 'Δημοσίευση αγγελίας';
  }

  toggleSelection(kind: SelectionKind, value: string, checked: boolean): void {
    const collection = this.getCollection(kind);
    if (checked) {
      if (!collection.includes(value)) {
        collection.push(value);
      }
    } else {
      const index = collection.indexOf(value);
      if (index !== -1) {
        collection.splice(index, 1);
      }
    }
  }

  addCustomValue(kind: SelectionKind): void {
    const input = this.customInputs[kind].trim();
    if (!input.length) {
      return;
    }

    const values = this.parseList(input);
    if (!values.length) {
      return;
    }

    const collection = this.getCollection(kind);
    const merged = this.unique([...collection, ...values]);
    this.setCollection(kind, merged);
    this.customInputs[kind] = '';
  }

  onUniversityChange(): void {
    this.form.profile.university = this.normalizeUniversity(this.form.profile.university);
    this.form.profile.department = this.normalizeDepartment(this.form.profile.department);
  }

  removeValue(kind: SelectionKind, value: string): void {
    const collection = this.getCollection(kind);
    const index = collection.indexOf(value);
    if (index !== -1) {
      collection.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    this.submissionError = undefined;
    this.submissionSuccess = undefined;

    const validationError = this.validate();
    if (validationError) {
      this.submissionError = validationError;
      return;
    }

    this.isSubmitting = true;

      const upload$ = this.selectedFiles.length
        ? this.uploadService.uploadImages('roommates', this.selectedFiles)
        : of<string[]>([]);

      upload$
        .pipe(
          switchMap(images => {
            const combinedImages = this.isEditMode
              ? Array.from(new Set([...this.existingImages, ...images]))
              : images;
            const payload = this.composePayload(combinedImages);
            return this.isEditMode && this.editingAdId
              ? this.roommateService.updateAd(this.editingAdId, payload)
              : this.roommateService.createAd(payload);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: ad => {
            this.submissionSuccess = this.isEditMode
              ? 'Η αγγελία ενημερώθηκε με επιτυχία!'
              : 'Η αγγελία καταχωρήθηκε με επιτυχία!';
            this.submissionError = undefined;
            setTimeout(() => {
              this.router.navigate(['/roommates', ad.id]);
            }, 800);
          },
          error: error => {
            this.submissionSuccess = undefined;
            this.submissionError = (error instanceof Error ? error.message : undefined) ?? 'Η υποβολή απέτυχε.';
          }
        });
  }

  trackByValue(_: number, item: string): string {
    return item;
  }

  trackByMode(_: number, option: { value: RoommateAdMode }): RoommateAdMode {
    return option.value;
  }

  onModeChange(): void {
    if (!this.titleManuallyEdited) {
      this.applyAutoTitle();
    }
  }

  onProfileNameChange(): void {
    if (!this.titleManuallyEdited) {
      this.applyAutoTitle();
    }
  }

  onLocationChange(): void {
    if (!this.titleManuallyEdited) {
      this.applyAutoTitle();
    }
  }

  onTitleChange(value: string): void {
    const trimmed = value?.trim() ?? '';
    if (!trimmed.length) {
      this.titleManuallyEdited = false;
      this.applyAutoTitle();
      return;
    }
    this.titleManuallyEdited = trimmed !== (this.lastGeneratedTitle?.trim() ?? '');
  }

  private prefillFromProfile(): void {
    const user = this.authService.currentStudentSnapshot();
    if (!user) {
      this.form.availableFrom = this.formatDateInput(new Date());
      this.form.propertyLocation = 'Σάμος';
      this.form.locationCity = 'Σάμος';
      this.applyAutoTitle();
      return;
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    this.form.profile.name = fullName.length ? fullName : 'Μέλος Unihome';
    this.form.profile.age = user.age ?? null;
    this.form.profile.university = this.normalizeUniversity(user.profile.university);
    this.form.profile.department = this.normalizeDepartment(user.profile.department);
    this.form.profile.semester = '';
    this.form.profile.gender = '';
    this.form.propertyLocation = 'Σάμος';
    this.form.locationCity = 'Σάμος';
    this.form.availableFrom = this.formatDateInput(this.soonestAvailableDate());
    this.form.description = '';
    this.form.bio = this.composeDefaultBio(this.form.profile.university);

    this.contact = {
      name: this.form.profile.name,
      phone: user.phone ?? '',
      email: user.email ?? '',
      instagram: '',
      facebook: ''
    };

    this.applyAutoTitle();

    this.onUniversityChange();
  }

  private soonestAvailableDate(): Date {
    const today = new Date();
    const next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    return next;
  }

  private validate(): string | undefined {
    if (!this.form.title.trim().length) {
      return 'Συμπλήρωσε έναν τίτλο για την αγγελία.';
    }
    if (!this.form.description.trim().length) {
      return 'Πρόσθεσε μια περιγραφή για να γνωρίσουν τα υπόλοιπα μέλη τον χώρο και τον χαρακτήρα σου.';
    }
    if (this.form.monthlyRent === null || !Number.isFinite(this.form.monthlyRent)) {
      return 'Καταχώρησε το μίσθωμα ανά μήνα.';
    }
    if (this.form.monthlyRent !== null && this.form.monthlyRent < 0) {
      return 'Το μίσθωμα δεν μπορεί να είναι αρνητικό.';
    }
    if (!this.form.availableFrom) {
      return 'Επίλεξε ημερομηνία διαθεσιμότητας.';
    }
    if (!this.selectedFiles.length && !this.existingImages.length) {
      return 'Πρόσθεσε τουλάχιστον μία φωτογραφία για την αγγελία.';
    }
    if (!this.hasContactDetails()) {
      return 'Συμπλήρωσε τα στοιχεία επικοινωνίας (email και κινητό).';
    }
    return undefined;
  }

  private composePayload(images: string[]): RoommateAdPayload {
    const preferences = this.unique([
      ...this.selectedPreferences,
      ...this.parseList(this.customInputs.preferences)
    ]);
    const lifestyle = this.unique([
      ...this.selectedLifestyle,
      ...this.parseList(this.customInputs.lifestyle)
    ]);
    const propertyFeatures = this.unique([
      ...this.selectedFeatures,
      ...this.parseList(this.customInputs.features)
    ]);
    const amenities = this.unique([
      ...this.selectedAmenities,
      ...this.parseList(this.customInputs.amenities)
    ]);

    const interests = this.parseList(this.form.interestsInput);
    const habits = this.parseList(this.form.habitsInput);
    const profile: RoommateAdPayload['profile'] = {
      name: this.form.profile.name.trim() || 'Μέλος Unihome',
      age: this.form.profile.age ?? undefined,
      gender: this.form.profile.gender.trim() || undefined,
      university: this.normalizeUniversity(this.form.profile.university) || undefined,
      department: this.normalizeDepartment(this.form.profile.department) || undefined,
      semester: this.form.profile.semester.trim() || undefined,
      bio: this.form.bio.trim() || undefined,
      interests: interests.length ? interests : undefined,
      habits: habits.length ? habits : undefined
    };

    const location = {
      city: (this.form.locationCity || this.form.propertyLocation || 'Σάμος').trim(),
      area: this.form.locationArea.trim() || undefined,
      proximity: this.form.locationProximity.trim() || undefined
    };

    const availableFromIso = this.ensureIsoDate(this.form.availableFrom);

    const contact = {
      name: this.contact.name.trim() || profile?.name || 'Μέλος Unihome',
      phone: (() => {
        const trimmed = this.contact.phone.trim();
        return trimmed.length ? trimmed : undefined;
      })(),
      email: (() => {
        const trimmed = this.contact.email.trim();
        return trimmed.length ? trimmed : undefined;
      })(),
      instagram: (() => {
        const trimmed = this.contact.instagram.trim();
        return trimmed.length ? trimmed : undefined;
      })(),
      facebook: (() => {
        const trimmed = this.contact.facebook.trim();
        return trimmed.length ? trimmed : undefined;
      })()
    };

    return {
      mode: this.form.mode,
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      monthlyRent: Number(this.form.monthlyRent) || 0,
      availableFrom: availableFromIso,
      preferences,
      propertyFeatures,
      lifestyle,
      profile,
      location,
      amenities,
      images: images.length ? images : undefined,
      contact
    };
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files) {
      return;
    }

    this.imageError = '';
    const files = Array.from(input.files).filter(file => file.type.startsWith('image/')).slice(0, 10);
    if (!files.length) {
      this.selectedFiles = [];
      this.imageError = 'Επίλεξε αρχεία εικόνας.';
      input.value = '';
      return;
    }

    this.selectedFiles = files;
    input.value = '';
  }

  removeExistingImage(image: string): void {
    this.existingImages = this.existingImages.filter(item => item !== image);
    if (!this.existingImages.length && !this.selectedFiles.length) {
      this.imageError = 'Πρόσθεσε τουλάχιστον μία φωτογραφία για την αγγελία.';
    }
  }

  removeSelectedFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(item => item !== file);
    if (!this.existingImages.length && !this.selectedFiles.length) {
      this.imageError = 'Πρόσθεσε τουλάχιστον μία φωτογραφία για την αγγελία.';
    }
  }

  trackBySelectedFile(_: number, file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  trackByImageUrl(_: number, url: string): string {
    return url;
  }

  private hasContactDetails(): boolean {
    return this.contact.email.trim().length > 0 && this.contact.phone.trim().length > 0;
  }

  private enterEditMode(adId: string): void {
    if (this.editingAdId !== adId) {
      this.editingAdId = adId;
      this.hasPrefilledForm = false;
    }

    this.isEditMode = true;
    const existing = this.roommateService.getAdById(adId);
    if (existing) {
      this.populateForm(existing);
    }

    this.subscriptions.add(
      this.roommateService.roommateAds$.subscribe(() => {
        const match = this.roommateService.getAdById(adId);
        if (match) {
          this.populateForm(match);
        }
      })
    );
  }

  private resetToCreateMode(): void {
    this.isEditMode = false;
    this.editingAdId = null;
    this.hasPrefilledForm = false;
    this.existingImages = [];
    this.selectedFiles = [];
    this.imageError = '';
    this.contact = {
      name: '',
      phone: '',
      email: '',
      instagram: '',
      facebook: ''
    };
    this.prefillFromProfile();
  }

  private applyUserDefaults(user: User | null): void {
    if (!user || !isStudentUser(user)) {
      return;
    }

    if (!this.form.profile.name.trim()) {
      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      if (fullName) {
        this.form.profile.name = fullName;
      }
    }

    if (this.form.profile.age === null && typeof user.age === 'number') {
      this.form.profile.age = user.age;
    }

    if (!this.form.profile.university) {
      this.form.profile.university = this.normalizeUniversity(user.profile.university);
    }

    if (!this.form.profile.department) {
      this.form.profile.department = this.normalizeDepartment(user.profile.department);
    }

    if (!this.contact.name.trim()) {
      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      this.contact.name = fullName || this.contact.name;
    }

    if (!this.contact.phone.trim()) {
      this.contact.phone = user.phone ?? this.contact.phone;
    }

    if (!this.contact.email.trim()) {
      this.contact.email = user.email ?? this.contact.email;
    }
  }

  private populateForm(ad: RoommateAd): void {
    if (!this.isEditMode || this.editingAdId !== ad.id || this.hasPrefilledForm) {
      return;
    }

    this.form = {
      ...this.form,
      mode: ad.mode,
      title: ad.title,
      monthlyRent: ad.monthlyRent,
      availableFrom: this.toDateInput(ad.availableFrom),
      propertyLocation: ad.propertyLocation ?? '',
      description: ad.description ?? '',
      bio: ad.profile?.bio ?? '',
      locationCity: ad.location?.city ?? '',
      locationArea: ad.location?.area ?? '',
      locationProximity: ad.location?.proximity ?? '',
      interestsInput: (ad.profile?.interests ?? []).join(', '),
      habitsInput: (ad.profile?.habits ?? []).join(', '),
      profile: {
        name: ad.profile?.name ?? this.form.profile.name,
        age: ad.profile?.age ?? null,
        gender: ad.profile?.gender ?? '',
        university: ad.profile?.university ?? this.form.profile.university,
        department: ad.profile?.department ?? this.form.profile.department,
        semester: ad.profile?.semester ?? ''
      }
    };

    this.selectedLifestyle = [...(ad.lifestyle ?? [])];
    this.selectedPreferences = [...(ad.preferences ?? [])];
    this.selectedFeatures = [...(ad.propertyFeatures ?? [])];
    this.selectedAmenities = [...(ad.amenities ?? [])];
    this.customInputs = { lifestyle: '', preferences: '', features: '', amenities: '' };
    this.existingImages = [...(ad.images ?? [])];
    this.selectedFiles = [];
    this.imageError = '';

    this.contact = {
      name: ad.contact?.name ?? '',
      phone: ad.contact?.phone ?? '',
      email: ad.contact?.email ?? '',
      instagram: ad.contact?.instagram ?? '',
      facebook: ad.contact?.facebook ?? ''
    };

    this.titleManuallyEdited = true;
    this.lastGeneratedTitle = ad.title;
    this.hasPrefilledForm = true;
  }

  private toDateInput(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  private parseList(input: string): string[] {
    if (!input) {
      return [];
    }
    return input
      .split(/,|\n/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));
  }

  private getCollection(kind: SelectionKind): string[] {
    switch (kind) {
      case 'lifestyle':
        return this.selectedLifestyle;
      case 'preferences':
        return this.selectedPreferences;
      case 'features':
        return this.selectedFeatures;
      case 'amenities':
        return this.selectedAmenities;
    }
  }

  private setCollection(kind: SelectionKind, values: string[]): void {
    switch (kind) {
      case 'lifestyle':
        this.selectedLifestyle = values;
        break;
      case 'preferences':
        this.selectedPreferences = values;
        break;
      case 'features':
        this.selectedFeatures = values;
        break;
      case 'amenities':
        this.selectedAmenities = values;
        break;
    }
  }

  private ensureIsoDate(input: string): string {
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed.toISOString();
    }
    return new Date().toISOString();
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeUniversity(value?: string): string {
    const trimmed = (value ?? '').trim();
    if (trimmed && this.universityOptions.includes(trimmed)) {
      return trimmed;
    }
    return this.universityOptions[0];
  }

  private normalizeDepartment(value?: string): string {
    const trimmed = (value ?? '').trim();
    if (trimmed && this.departmentOptions.includes(trimmed)) {
      return trimmed;
    }
    return this.departmentOptions[0] ?? '';
  }

  private composeDefaultBio(university?: string): string {
    const uni = this.normalizeUniversity(university);
    return uni ? `Μέλος της κοινότητας του ${uni}` : 'Μέλος της κοινότητας Unihome';
  }

  private applyAutoTitle(): void {
    const generated = this.composeDefaultTitle();
    this.lastGeneratedTitle = generated;
    this.form.title = generated;
    this.titleManuallyEdited = false;
  }

  private composeDefaultTitle(): string {
    const name = this.form.profile.name?.trim() || 'Μέλος Unihome';
    const baseCity = (this.form.locationCity || this.form.propertyLocation || 'Σάμος').trim();
    switch (this.form.mode) {
      case 'FINDING_HOME_WITH_ROOMMATE':
        return `${name} αναζητά συγκάτοικο για να βρείτε σπίτι μαζί στο ${baseCity}`.trim();
      case 'LOOKING_FOR_ROOM':
        return `${name} αναζητά συγκάτοικο με σπίτι στο ${baseCity}`.trim();
      case 'VACANCY_NEEDS_ROOMMATE':
        return `${name} διαθέτει δωμάτιο για συγκάτοικο στο ${baseCity}`.trim();
      case 'HOST_SEEKING_ROOMMATE':
      default:
        return `${name} φιλοξενεί συγκάτοικο στο ${baseCity}`.trim();
    }
  }
}
