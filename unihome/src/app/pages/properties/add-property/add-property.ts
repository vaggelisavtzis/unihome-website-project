import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { PropertyService, PropertyPayload } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';
import { UploadService } from '../../../services/upload.service';
import { Property } from '../../../models/property.model';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [FormsModule, RouterModule, NgIf, NgFor, NgForOf],
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.scss']
})
export class AddPropertyComponent implements OnInit, OnDestroy {
  availableFeatures = [
    'Κλιματισμός',
    'Θέρμανση',
    'Internet',
    'Πλυντήριο',
    'Ψυγείο',
    'Κουζίνα',
    'Μπαλκόνι',
    'Ανελκυστήρας',
    'Πάρκινγκ'
  ];

  furnishedOptions = [
    { value: 'yes', label: 'Επιπλωμένο' },
    { value: 'no', label: 'Μη επιπλωμένο' }
  ] as const;

  damageOptions = [
    { value: 'no', label: 'Χωρίς ζημιές' },
    { value: 'yes', label: 'Υπάρχουν ζημιές' }
  ] as const;

  property = {
    title: '',
    type: '',
    price: null as number | null,
    area: null as number | null,
    rooms: null as number | null,
    address: '',
    city: '',
    postalCode: '',
    lat: '',
    lng: '',
    features: [] as string[],
    description: '',
    isFurnished: '' as 'yes' | 'no' | '',
    hasDamage: '' as 'yes' | 'no' | '',
    offersHospitality: false,
    contactInstagram: '',
    contactFacebook: ''
  };

  customFeaturesInput = '';

  selectedFiles: File[] = [];
  existingImages: string[] = [];
  imageError = '';
  isSubmitting = false;
  submissionError = '';
  isEditMode = false;
  private editingPropertyId: string | null = null;
  private hasPrefilledForm = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly propertyService: PropertyService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly uploadService: UploadService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const propertyId = params.get('id');
        if (propertyId) {
          this.enterEditMode(propertyId);
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
    return this.isEditMode ? 'Επεξεργασία Ακινήτου' : 'Προσθήκη Ακινήτου';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Αποθήκευση αλλαγών' : 'Δημοσίευση αγγελίας';
  }

  toggleFeature(feature: string) {
    const index = this.property.features.indexOf(feature);
    if (index > -1) {
      this.property.features.splice(index, 1);
    } else {
      this.property.features.push(feature);
    }
  }

  addCustomFeatures(): void {
    this.mergeCustomFeatures(this.customFeaturesInput);
    this.customFeaturesInput = '';
  }

  removeFeature(feature: string): void {
    this.property.features = this.property.features.filter(item => item !== feature);
  }

  trackByFeature(_: number, feature: string): string {
    return feature;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files) {
      return;
    }

    this.imageError = '';

    const incomingFiles = Array.from(input.files).filter(file => file.type.startsWith('image/'));
    if (!incomingFiles.length) {
      this.selectedFiles = [];
      this.imageError = 'Επίλεξε αρχεία εικόνας.';
      input.value = '';
      return;
    }

    const combined = [...this.selectedFiles, ...incomingFiles];
    const uniqueFiles: File[] = [];
    const seen = new Set<string>();

    for (const file of combined) {
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      uniqueFiles.push(file);
      if (uniqueFiles.length >= 10) {
        break;
      }
    }

    if (uniqueFiles.length < combined.length) {
      this.imageError = 'Μπορείς να ανεβάσεις έως 10 εικόνες.';
    }

    this.selectedFiles = uniqueFiles;
    input.value = '';
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    this.mergeCustomFeatures(this.customFeaturesInput);

    this.submissionError = '';
    this.imageError = '';

    const hasExistingImages = this.existingImages.length > 0;
    const hasNewImages = this.selectedFiles.length > 0;
    if (!hasExistingImages && !hasNewImages) {
      this.imageError = 'Πρέπει να προσθέσεις τουλάχιστον μία φωτογραφία.';
      return;
    }

    if (!this.property.title.trim() || !this.property.type) {
      this.submissionError = 'Συμπλήρωσε τίτλο και τύπο ακινήτου.';
      return;
    }

    if (!this.property.description.trim()) {
      this.submissionError = 'Η περιγραφή είναι υποχρεωτική.';
      return;
    }

    const price = Number(this.property.price);
    const area = Number(this.property.area);
    const rooms = Number(this.property.rooms);

    if (!Number.isFinite(price) || price <= 0) {
      this.submissionError = 'Η τιμή πρέπει να είναι θετικός αριθμός.';
      return;
    }

    if (!Number.isFinite(area) || area <= 0) {
      this.submissionError = 'Τα τετραγωνικά πρέπει να είναι θετικός αριθμός.';
      return;
    }

    if (!Number.isFinite(rooms) || rooms <= 0) {
      this.submissionError = 'Ο αριθμός δωματίων πρέπει να είναι θετικός.';
      return;
    }

    this.isSubmitting = true;

    const upload$ = this.selectedFiles.length
      ? this.uploadService.uploadImages('properties', this.selectedFiles)
      : of<string[]>([]);

    this.subscriptions.add(
      upload$
        .pipe(
          switchMap(images => {
            const combinedImages = this.isEditMode
              ? Array.from(new Set([...this.existingImages, ...images]))
              : images;
            if (!combinedImages.length) {
              throw new Error('Η μεταφόρτωση εικόνων απέτυχε. Δοκίμασε ξανά με άλλη εικόνα.');
            }
            const payload = this.buildPayload(price, area, rooms, combinedImages);
            return this.isEditMode && this.editingPropertyId
              ? this.propertyService.updateProperty(this.editingPropertyId, payload)
              : this.propertyService.createProperty(payload);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: property => {
            this.router.navigate(['/properties', property.id]);
          },
          error: error => {
            this.submissionError =
              (error instanceof Error ? error.message : undefined) ?? 'Η αποθήκευση απέτυχε. Δοκίμασε ξανά.';
          }
        })
    );
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

  private buildPayload(price: number, area: number, rooms: number, images: string[]): PropertyPayload {
    const owner = this.authService.currentOwnerSnapshot();
    const contactName = owner ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() : undefined;
    const lat = this.parseCoordinate(this.property.lat);
    const lng = this.parseCoordinate(this.property.lng);
    const inferred = this.inferCoordinates(this.property.city);
    const resolvedLat = typeof lat === 'number' ? lat : inferred?.lat;
    const resolvedLng = typeof lng === 'number' ? lng : inferred?.lng;

    const payload: PropertyPayload = {
      title: this.property.title,
      type: this.property.type,
      price,
      area,
      rooms,
      address: this.property.address,
      city: this.property.city,
      postalCode: this.property.postalCode,
      description: this.property.description,
      features: this.unique(this.property.features),
      images,
      isFurnished: this.property.isFurnished === 'yes',
      hasDamage: this.property.hasDamage === 'yes',
      contactName: contactName || undefined,
      contactPhone: owner?.phone || undefined,
      contactEmail: owner?.email || undefined,
      contactInstagram: this.property.contactInstagram || undefined,
      contactFacebook: this.property.contactFacebook || undefined,
      hospitality: this.property.offersHospitality,
      lat: typeof resolvedLat === 'number' && typeof resolvedLng === 'number' ? resolvedLat : undefined,
      lng: typeof resolvedLat === 'number' && typeof resolvedLng === 'number' ? resolvedLng : undefined
    };

    return payload;
  }

  private enterEditMode(propertyId: string): void {
    if (this.editingPropertyId !== propertyId) {
      this.editingPropertyId = propertyId;
      this.hasPrefilledForm = false;
    }

    this.isEditMode = true;
    this.propertyService.ensureLoaded();

    const existing = this.propertyService.getPropertyById(propertyId);
    if (existing) {
      this.populateForm(existing);
    }

    this.subscriptions.add(
      this.propertyService.properties$.subscribe(properties => {
        const match = properties.find(item => item.id === propertyId);
        if (match) {
          this.populateForm(match);
        }
      })
    );
  }

  private populateForm(property: Property): void {
    if (!this.isEditMode || this.editingPropertyId !== property.id) {
      return;
    }

    if (this.hasPrefilledForm) {
      return;
    }

    this.property = {
      title: property.title,
      type: property.type,
      price: property.price ?? null,
      area: property.area ?? null,
      rooms: property.rooms ?? null,
      address: property.location.address,
      city: property.location.city,
      postalCode: property.location.postalCode,
      lat: typeof property.location.lat === 'number' ? String(property.location.lat) : '',
      lng: typeof property.location.lng === 'number' ? String(property.location.lng) : '',
      features: [...property.features],
      description: property.description,
      isFurnished: property.basics?.furnished ? 'yes' : 'no',
      hasDamage: property.basics?.hasDamage ? 'yes' : 'no',
      offersHospitality: !!property.hospitality,
      contactInstagram: property.contact?.instagram ?? '',
      contactFacebook: property.contact?.facebook ?? ''
    };
    this.customFeaturesInput = '';
    this.existingImages = [...property.images];
    this.selectedFiles = [];
    this.imageError = '';
    this.hasPrefilledForm = true;
  }

  private resetToCreateMode(): void {
    this.isEditMode = false;
    this.editingPropertyId = null;
    this.hasPrefilledForm = false;
    this.existingImages = [];
    this.selectedFiles = [];
    this.imageError = '';
    this.submissionError = '';
    this.property = {
      title: '',
      type: 'Διαμέρισμα',
      price: null as number | null,
      area: null as number | null,
      rooms: null as number | null,
      address: '',
      city: '',
      postalCode: '',
      lat: '',
      lng: '',
      features: [],
      description: '',
      isFurnished: '' as 'yes' | 'no' | '',
      hasDamage: '' as 'yes' | 'no' | '',
      offersHospitality: false,
      contactInstagram: '',
      contactFacebook: ''
    };
    this.customFeaturesInput = '';
  }

  private parseCoordinate(value: string): number | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private inferCoordinates(city: string): { lat: number; lng: number } | undefined {
    const normalized = (city ?? '').trim().toLowerCase();
    const lookup: Record<string, { lat: number; lng: number }> = {
      'καρλόβασι': { lat: 37.7969, lng: 26.7036 },
      'καρλοβασι': { lat: 37.7969, lng: 26.7036 },
      'βαθύ': { lat: 37.7545, lng: 26.9781 },
      'βαθυ': { lat: 37.7545, lng: 26.9781 },
      'πυθαγόρειο': { lat: 37.6896, lng: 26.9439 },
      'πυθαγορειο': { lat: 37.6896, lng: 26.9439 }
    };
    return lookup[normalized];
  }

  private mergeCustomFeatures(input: string): void {
    const values = this.parseList(input);
    if (!values.length) {
      return;
    }
    this.property.features = this.unique([...this.property.features, ...values]);
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
}
