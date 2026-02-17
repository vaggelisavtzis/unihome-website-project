import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { TemporaryService, TemporaryStayPayload } from '../../../services/temporary.service';
import { TemporaryStay, TemporaryStayCostCategory, TemporaryStayType } from '../../../models/temporary-stay.model';
import { UploadService } from '../../../services/upload.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-add-temporary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-temporary.html',
  styleUrls: ['./add-temporary.scss']
})
export class AddTemporaryComponent implements OnInit, OnDestroy {
  readonly stayTypes: TemporaryStayType[] = ['Δωμάτιο', 'Ξενοδοχείο', 'Airbnb', 'Hostel', 'Φιλοξενία'];
  readonly costOptions: ReadonlyArray<{ value: TemporaryStayCostCategory; label: string }> = [
    { value: 'paid', label: 'Με χρέωση' },
    { value: 'free', label: 'Δωρεάν φιλοξενία' }
  ];
  readonly amenityOptions: readonly string[] = [
    'Wi-Fi',
    'Κλιματισμός',
    'Θέρμανση',
    'Κουζίνα',
    'Πλυντήριο',
    'Πρωινό',
    'Μεταφορά από/προς Πανεπιστήμιο',
    'Θέα θάλασσα',
    'Κοινόχρηστο καθιστικό',
    'Χώρος στάθμευσης'
  ];

  form = {
    title: '',
    description: '',
    type: 'Δωμάτιο' as TemporaryStayType,
    pricePerNight: null as number | null,
    minNights: 1,
    costCategory: 'paid' as TemporaryStayCostCategory,
    location: {
      address: '',
      city: '',
      postalCode: '',
      lat: '',
      lng: ''
    },
    amenities: [] as string[],
    contact: {
      name: '',
      phone: '',
      email: '',
      website: '',
      instagram: '',
      facebook: ''
    },
    availability: {
      startDate: '',
      endDate: '',
      label: '',
      note: '',
      calendarUrl: ''
    }
  };

  feedback: { tone: 'success' | 'error'; message: string } | null = null;
  isSaving = false;
  selectedFiles: File[] = [];
  existingImages: string[] = [];
  imageError = '';
  isEditMode = false;
  private editingStayId: string | null = null;
  private editingStay: TemporaryStay | null = null;
  private hasPrefilledForm = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly temporaryService: TemporaryService,
    private readonly router: Router,
    private readonly uploadService: UploadService,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (!this.isEditMode) {
          this.prefillContact(user);
        }
      })
    );
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const stayId = params.get('id');
        if (stayId) {
          this.enterEditMode(stayId);
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
    return this.isEditMode ? 'Επεξεργασία' : 'Νέα καταχώρηση';
  }

  get heading(): string {
    return this.isEditMode ? 'Επεξεργασία Προσωρινής Διαμονής' : 'Καταχώρηση Προσωρινής Διαμονής';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Αποθήκευση αλλαγών' : 'Δημοσίευση καταχώρησης';
  }

  toggleAmenity(amenity: string): void {
    const index = this.form.amenities.indexOf(amenity);
    if (index >= 0) {
      this.form.amenities.splice(index, 1);
    } else {
      this.form.amenities.push(amenity);
    }
  }

  amenitySelected(amenity: string): boolean {
    return this.form.amenities.includes(amenity);
  }

  onSubmit(): void {
    if (this.isSaving) {
      return;
    }

    this.feedback = null;
    this.imageError = '';

    const hasExistingImages = this.existingImages.length > 0;
    const hasNewImages = this.selectedFiles.length > 0;
    if (!hasExistingImages && !hasNewImages) {
      this.imageError = 'Πρέπει να προσθέσεις τουλάχιστον μία φωτογραφία.';
      this.feedback = { tone: 'error', message: this.imageError };
      return;
    }

    if (!this.form.title.trim()) {
      this.feedback = { tone: 'error', message: 'Συμπλήρωσε τίτλο για την καταχώρηση.' };
      return;
    }

    if (!this.form.description.trim()) {
      this.feedback = { tone: 'error', message: 'Πρόσθεσε μια περιγραφή για την καταχώρηση.' };
      return;
    }

    if (!this.form.location.address.trim() || !this.form.location.city.trim()) {
      this.feedback = { tone: 'error', message: 'Συμπλήρωσε διεύθυνση και πόλη.' };
      return;
    }

    if (!this.form.contact.name.trim() || !this.form.contact.phone.trim()) {
      this.feedback = { tone: 'error', message: 'Συμπλήρωσε όνομα και τηλέφωνο επικοινωνίας.' };
      return;
    }

    const price = this.form.costCategory === 'free' ? 0 : Number(this.form.pricePerNight ?? 0);
    if (!Number.isFinite(price) || price < 0) {
      this.feedback = { tone: 'error', message: 'Το κόστος διαμονής δεν είναι έγκυρο.' };
      return;
    }

    if (!Number.isFinite(this.form.minNights) || this.form.minNights < 1) {
      this.feedback = { tone: 'error', message: 'Οι ελάχιστες νύχτες δεν είναι έγκυρες.' };
      return;
    }

    this.isSaving = true;

    const upload$ = this.selectedFiles.length
      ? this.uploadService.uploadImages('temporary-stays', this.selectedFiles)
      : of<string[]>([]);

    this.subscriptions.add(
      upload$
        .pipe(
          switchMap(images => {
            const combinedImages = this.isEditMode
              ? Array.from(new Set([...this.existingImages, ...images]))
              : images;
            if (!combinedImages.length) {
              throw new Error('Η μεταφόρτωση εικόνων απέτυχε. Δοκίμασε ξανά.');
            }
            const payload = this.buildPayload(combinedImages);
            return this.isEditMode && this.editingStayId
              ? this.temporaryService.updateStay(this.editingStayId, payload)
              : this.temporaryService.addStay(payload);
          }),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: stay => {
            this.feedback = {
              tone: 'success',
              message: this.isEditMode
                ? 'Οι αλλαγές αποθηκεύτηκαν. Ανακατεύθυνση στη λίστα...'
                : 'Η προσωρινή διαμονή καταχωρήθηκε επιτυχώς. Ανακατεύθυνση στη λίστα...'
            };
            window.setTimeout(() => {
              this.router.navigate(['/temporary'], {
                queryParams: this.isEditMode ? { focus: stay.id } : undefined
              });
            }, 900);
          },
          error: error => {
            this.feedback = {
              tone: 'error',
              message: error instanceof Error ? error.message : 'Η καταχώρηση δεν αποθηκεύτηκε.'
            };
          }
        })
    );
  }

  private buildPayload(images: string[]): TemporaryStayPayload {
    const price = this.form.costCategory === 'free' ? 0 : Number(this.form.pricePerNight ?? 0);
    const amenities = [...this.form.amenities];

    const availabilityWindows = this.form.availability.startDate
      ? [
          {
            startDate: this.form.availability.startDate,
            endDate: this.form.availability.endDate || undefined,
            label: this.form.availability.label || undefined
          }
        ]
      : undefined;

    const availability = availabilityWindows || this.form.availability.note || this.form.availability.calendarUrl
      ? {
          unavailable: availabilityWindows,
          note: this.form.availability.note || undefined,
          calendarUrl: this.form.availability.calendarUrl || undefined
        }
      : undefined;

    const payload: TemporaryStayPayload = {
      title: this.form.title,
      description: this.form.description,
      type: this.form.type,
      pricePerNight: price,
      minNights: this.form.minNights,
      costCategory: this.form.costCategory,
      location: {
        address: this.form.location.address,
        city: this.form.location.city,
        postalCode: this.form.location.postalCode,
        lat: this.parseCoordinate(this.form.location.lat),
        lng: this.parseCoordinate(this.form.location.lng)
      },
      amenities,
      images,
      contact: {
        name: this.form.contact.name,
        phone: this.form.contact.phone,
        email: this.form.contact.email || undefined,
        website: this.form.contact.website || undefined,
        instagram: this.form.contact.instagram || undefined,
        facebook: this.form.contact.facebook || undefined
      },
      availability
    };

    if (this.isEditMode && this.editingStay) {
      payload.purpose = this.editingStay.purpose;
      if (this.editingStay.linkedPropertyId) {
        payload.linkedPropertyId = this.editingStay.linkedPropertyId;
      }
    }

    return payload;
  }

  private parseCoordinate(value: string): number | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
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
      this.imageError = 'Πρέπει να προσθέσεις τουλάχιστον μία φωτογραφία.';
    }
  }

  removeSelectedFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(item => item !== file);
    if (!this.existingImages.length && !this.selectedFiles.length) {
      this.imageError = 'Πρέπει να προσθέσεις τουλάχιστον μία φωτογραφία.';
    }
  }

  trackByImageUrl(_: number, image: string): string {
    return image;
  }

  trackBySelectedFile(_: number, file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  private enterEditMode(stayId: string): void {
    if (this.editingStayId !== stayId) {
      this.editingStayId = stayId;
      this.hasPrefilledForm = false;
    }

    this.isEditMode = true;
    this.editingStay = null;
    this.existingImages = [];
    this.selectedFiles = [];
    this.imageError = '';
    this.temporaryService.ensureLoaded();
    this.temporaryService.ensureStayLoaded(stayId);

    const existing = this.temporaryService.getStayById(stayId);
    if (existing) {
      this.populateForm(existing);
    }

    this.subscriptions.add(
      this.temporaryService.stays$.subscribe(stays => {
        const match = stays.find(stay => stay.id === stayId);
        if (match) {
          this.populateForm(match);
        }
      })
    );
  }

  private populateForm(stay: TemporaryStay): void {
    if (!this.isEditMode || this.editingStayId !== stay.id) {
      return;
    }

    if (this.hasPrefilledForm) {
      return;
    }

    const availabilityWindow = stay.availability?.unavailable?.[0];

    this.editingStay = stay;
    this.form = {
      title: stay.title,
      description: stay.description,
      type: stay.type,
      pricePerNight: stay.costCategory === 'free' ? null : stay.pricePerNight,
      minNights: stay.minNights,
      costCategory: stay.costCategory,
      location: {
        address: stay.location.address || '',
        city: stay.location.city || '',
        postalCode: stay.location.postalCode || '',
        lat: stay.location.lat !== undefined ? String(stay.location.lat) : '',
        lng: stay.location.lng !== undefined ? String(stay.location.lng) : ''
      },
      amenities: [...stay.amenities],
      contact: {
        name: stay.contact?.name || '',
        phone: stay.contact?.phone || '',
        email: stay.contact?.email || '',
        website: stay.contact?.website || '',
        instagram: stay.contact?.instagram || '',
        facebook: stay.contact?.facebook || ''
      },
      availability: {
        startDate: availabilityWindow?.startDate?.slice(0, 10) ?? '',
        endDate: availabilityWindow?.endDate?.slice(0, 10) ?? '',
        label: availabilityWindow?.label ?? '',
        note: stay.availability?.note ?? '',
        calendarUrl: stay.availability?.calendarUrl ?? ''
      }
    };

    this.existingImages = [...stay.images];
    this.selectedFiles = [];
    this.imageError = '';
    this.hasPrefilledForm = true;
  }

  private resetToCreateMode(): void {
    this.isEditMode = false;
    this.editingStayId = null;
    this.editingStay = null;
    this.hasPrefilledForm = false;
    this.existingImages = [];
    this.selectedFiles = [];
    this.form = {
      title: '',
      description: '',
      type: 'Δωμάτιο',
      pricePerNight: null,
      minNights: 1,
      costCategory: 'paid',
      location: {
        address: '',
        city: '',
        postalCode: '',
        lat: '',
        lng: ''
      },
      amenities: [],
      contact: {
        name: '',
        phone: '',
        email: '',
        website: '',
        instagram: '',
        facebook: ''
      },
      availability: {
        startDate: '',
        endDate: '',
        label: '',
        note: '',
        calendarUrl: ''
      }
    };
    this.imageError = '';
    this.prefillContact(this.authService.currentUserSnapshot());
  }

  private prefillContact(user: User | null): void {
    if (!user) {
      return;
    }

    const currentName = (this.form.contact.name || '').trim();
    const currentPhone = (this.form.contact.phone || '').trim();
    const currentEmail = (this.form.contact.email || '').trim();

    if (!currentName) {
      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      this.form.contact.name = fullName || this.form.contact.name;
    }

    if (!currentPhone) {
      this.form.contact.phone = user.phone ?? this.form.contact.phone;
    }

    if (!currentEmail) {
      this.form.contact.email = user.email ?? this.form.contact.email;
    }
  }
}
