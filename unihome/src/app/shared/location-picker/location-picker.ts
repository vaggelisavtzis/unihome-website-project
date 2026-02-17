import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

type LeafletModule = typeof import('leaflet');

type LatLngLiteral = { lat: number; lng: number };

let pickerId = 0;

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.scss'
})
export class LocationPickerComponent implements OnDestroy {
  @Input() label = 'Περιοχή';
  @Input() placeholder = 'Πληκτρολόγησε περιοχή';
  @Input() hideLabel = false;
  @Input() granularity: 'exact' | 'area' = 'exact';

  @Input()
  get value(): string {
    return this._value;
  }
  set value(next: string) {
    this._value = next ?? '';
    if (!this.mapSelectionInProgress) {
      this.selectedLabel = '';
    }
  }

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('mapRoot') private mapRoot?: ElementRef<HTMLDivElement>;

  inputId = `location_${++pickerId}`;
  isMapOpen = false;
  statusMessage = this.initialStatusMessage();
  pendingAddress = '';
  selectedLabel = '';
  private _value = '';
  private leaflet?: LeafletModule;
  private mapInstance?: import('leaflet').Map;
  private marker?: import('leaflet').Marker;
  private pendingLatLng?: LatLngLiteral;
  private mapSelectionInProgress = false;
  private defaultIcon?: import('leaflet').Icon;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMapOpen) {
      this.closeMap();
    }
  }

  ngOnDestroy(): void {
    this.mapInstance?.remove();
  }

  onInputChange(value: string): void {
    this._value = value;
    this.selectedLabel = '';
    this.valueChange.emit(this._value);
  }

  async openMap(): Promise<void> {
    if (this.isMapOpen) {
      return;
    }
    this.isMapOpen = true;
    this.pendingAddress = '';
    this.pendingLatLng = undefined;
    this.mapSelectionInProgress = false;
    this.statusMessage = this.initialStatusMessage();
    await this.ensureMap();
  }

  closeMap(): void {
    this.isMapOpen = false;
    this.mapSelectionInProgress = false;
    this.statusMessage = this.initialStatusMessage();
  }

  applyPending(): void {
    if (!this.pendingAddress) {
      return;
    }
    this.mapSelectionInProgress = true;
    this.setValue(this.pendingAddress);
    this.selectedLabel = this.pendingAddress;
    this.closeMap();
  }

  private setValue(next: string): void {
    this._value = next;
    this.valueChange.emit(this._value);
  }

  private async ensureMap(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.leaflet) {
      try {
        const module = await import('leaflet');
        // Normalize: some builds expose Leaflet on the default export
        this.leaflet = (module as any).default ?? module;
      } catch (error) {
        console.error('[location-picker] failed to import leaflet', error);
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 0));
    const container = this.mapRoot?.nativeElement;
    if (!container || !this.leaflet) {
      console.error('[location-picker] missing container or leaflet module', { containerExists: !!container, leaflet: this.leaflet });
      return;
    }

    const L = this.leaflet;

    if (!this.defaultIcon) {
      this.defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }

    if (!this.mapInstance) {
      this.mapInstance = L.map(container, {
        center: [37.754, 26.977],
        zoom: 11
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.mapInstance);

      this.mapInstance.on('click', async (event: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        this.pendingLatLng = { lat, lng };
        this.statusMessage = this.searchingStatusMessage();
        const resolved = await this.reverseGeocode(lat, lng);
        this.pendingAddress = resolved;
        this.statusMessage = resolved
          ? `${this.pendingLabelPrefix()}: ${resolved}`
          : this.noResultStatusMessage();
        this.placeMarker({ lat, lng });
      });
    } else {
      setTimeout(() => this.mapInstance?.invalidateSize(), 0);
    }
  }

  private placeMarker(point: LatLngLiteral): void {
    if (!this.mapInstance || !this.leaflet || !this.defaultIcon) {
      return;
    }

    if (!this.marker) {
      this.marker = this.leaflet.marker(point, { icon: this.defaultIcon }).addTo(this.mapInstance);
    } else {
      this.marker.setLatLng(point);
    }

    const zoomLevel = this.granularity === 'area' ? 12 : 13;
    this.mapInstance.setView(point, zoomLevel, { animate: true });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: lat.toString(),
      lon: lng.toString(),
      zoom: this.granularity === 'area' ? '12' : '16',
      addressdetails: '1',
      namedetails: '1'
    });

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'el,en'
        }
      });

      if (!response.ok) {
        return this.fallbackLabel(lat, lng);
      }

      const data = (await response.json()) as {
        address?: Record<string, string>;
        display_name?: string;
        namedetails?: Record<string, string>;
      };

      const generalLabel = this.generalLocalityLabel(data.address ?? {}, data.namedetails ?? {});

      if (generalLabel) {
        return generalLabel;
      }

      if (data.display_name) {
        const parts = data.display_name
          .split(',')
          .map(part => part.trim())
          .filter(Boolean)
          .map(this.cleanLabel);
        if (parts.length) {
          return parts[0];
        }
        return this.cleanLabel(data.display_name);
      }

      return this.fallbackLabel(lat, lng);
    } catch {
      return this.fallbackLabel(lat, lng);
    }
  }

  private fallbackLabel(lat: number, lng: number): string {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  private generalLocalityLabel(address: Record<string, string>, namedetails: Record<string, string>): string {
    const nameCandidates = [
      namedetails['name:el'],
      namedetails['name'],
      namedetails['localname'],
      namedetails['alt_name:el'],
      namedetails['official_name:el'],
      namedetails['short_name:el'],
      namedetails['name:en'],
      namedetails['name:latin']
    ]
      .map(value => this.cleanLabel(value))
      .filter(Boolean);

    if (nameCandidates.length) {
      return nameCandidates[0];
    }

    const localityChain = [
      address['city'],
      address['town'],
      address['village'],
      address['hamlet'],
      address['village'],
      address['town'],
      address['city'],
      address['municipality'],
      address['city_district'],
      address['district'],
      address['quarter'],
      address['suburb'],
      address['neighbourhood'],
      address['locality'],
      address['county'],
      address['state_district']
    ]
      .map(value => this.cleanLabel(value))
      .filter(Boolean);

    if (localityChain.length) {
      return localityChain[0];
    }

    const broader = [address['state'], address['region'], address['country']]
      .map(value => this.cleanLabel(value))
      .filter(Boolean);

    return broader.length ? broader[0] : '';
  }

  private cleanLabel(value?: string | null): string {
    if (!value) {
      return '';
    }

    let cleaned = value.trim();

    const prefixPatterns: RegExp[] = [
      /^Municipal\s+Unit\s+of\s+/i,
      /^Municipal\s+Unit\s+/i,
      /^Municipality\s+of\s+/i,
      /^Municipality\s+/i,
      /^Regional\s+Unit\s+of\s+/i,
      /^Regional\s+Unit\s+/i,
      /^Prefecture\s+of\s+/i,
      /^Δημοτική\s+Ενότητα\s+/,
      /^Δήμος\s+/,
      /^Περιφερειακή\s+Ενότητα\s+/,
      /^Νομός\s+/
    ];

    for (const pattern of prefixPatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    const suffixPatterns: RegExp[] = [
      /\s+Municipal\s+Unit$/i,
      /\s+Municipality$/i,
      /\s+Regional\s+Unit$/i,
      /\s+Prefecture$/i
    ];

    for (const pattern of suffixPatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    return cleaned;
  }

  private initialStatusMessage(): string {
    return this.granularity === 'area'
      ? 'Πάτησε στον χάρτη για να ορίσεις ευρύτερη περιοχή.'
      : 'Πάτησε στον χάρτη για να ορίσεις περιοχή.';
  }

  private searchingStatusMessage(): string {
    return this.granularity === 'area' ? 'Αναζήτηση περιοχής...' : 'Αναζήτηση τοποθεσίας...';
  }

  private noResultStatusMessage(): string {
    return this.granularity === 'area'
      ? 'Δεν βρέθηκε περιγραφή για την περιοχή. Μπορείς να την χρησιμοποιήσεις όπως είναι ή να δοκιμάσεις ξανά.'
      : 'Δεν βρέθηκε ακριβής περιγραφή για το σημείο. Μπορείς να χρησιμοποιήσεις τα στοιχεία ή να δοκιμάσεις ξανά.';
  }

  private pendingLabelPrefix(): string {
    return this.granularity === 'area' ? 'Προτεινόμενη περιοχή' : 'Προτεινόμενη τοποθεσία';
  }

  get mapDialogTitle(): string {
    return this.granularity === 'area' ? 'Επίλεξε ευρύτερη περιοχή' : 'Επίλεξε περιοχή στον χάρτη';
  }

  get pendingLabel(): string {
    return this.pendingLabelPrefix();
  }
}
