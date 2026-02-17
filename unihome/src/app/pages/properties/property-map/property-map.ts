import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Property } from '../../../models/property.model';

type LeafletModule = typeof import('leaflet');

type MapInstance = import('leaflet').Map;
type MarkerInstance = import('leaflet').Marker;
type LatLngLiteral = { lat: number; lng: number };

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-map.html',
  styleUrls: ['./property-map.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() properties: Property[] | null = [];
  @Input() highlightPropertyId: string | null = null;
  @Output() propertyFocus = new EventEmitter<Property>();

  @ViewChild('mapRoot', { static: true }) private mapRoot?: ElementRef<HTMLDivElement>;

  isReady = false;
  hasMarkers = false;

  private leaflet?: LeafletModule;
  private map?: MapInstance;
  private markers: Map<string, MarkerInstance> = new Map();
  private defaultIcon?: import('leaflet').Icon;

  async ngAfterViewInit(): Promise<void> {
    await this.ensureMap();
    this.renderMarkers();
    this.focusActiveMarker();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isReady) {
      return;
    }

    if (changes['properties']) {
      this.renderMarkers();
    }

    if (changes['highlightPropertyId']) {
      this.focusActiveMarker();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.markers.clear();
  }

  private async ensureMap(): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (!this.mapRoot) {
      console.error('[property-map] mapRoot missing');
      return;
    }

    if (!this.leaflet) {
      try {
        const module = await import('leaflet');
        // Normalize: some builds expose Leaflet on the default export.
        this.leaflet = (module as any).default ?? module;
      } catch (error) {
        console.error('[property-map] failed to import leaflet', error);
        return;
      }
    }

    const container = this.mapRoot.nativeElement;
    const L = this.leaflet;

    if (!L) {
      console.error('[property-map] leaflet module undefined');
      return;
    }

    if (typeof L.icon !== 'function') {
      console.error('[property-map] leaflet.icon missing or not a function', L);
      return;
    }

    if (!this.defaultIcon) {
      this.defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -28],
        shadowSize: [41, 41]
      });
    }

    this.map = L.map(container, {
      center: [37.754, 26.977],
      zoom: 11
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.isReady = true;
  }

  private renderMarkers(): void {
    const L = this.leaflet;
    if (!this.map || !L) {
      return;
    }

    for (const marker of this.markers.values()) {
      marker.removeFrom(this.map);
    }
    this.markers.clear();

    const scoped = (this.properties ?? []).filter(property => this.hasCoordinates(property));
    if (!scoped.length) {
      this.hasMarkers = false;
      return;
    }

    const bounds: LatLngLiteral[] = [];
    const coordCounts = new Map<string, number>();

    for (const property of scoped) {
      const baseLat = property.location.lat!;
      const baseLng = property.location.lng!;
      const coordKey = `${baseLat.toFixed(6)}:${baseLng.toFixed(6)}`;
      const duplicateIndex = coordCounts.get(coordKey) ?? 0;
      coordCounts.set(coordKey, duplicateIndex + 1);

      let latLng: LatLngLiteral = { lat: baseLat, lng: baseLng };
      if (duplicateIndex > 0) {
        const angle = (duplicateIndex * 45) * (Math.PI / 180);
        const radius = 0.00015 * duplicateIndex;
        latLng = {
          lat: baseLat + Math.sin(angle) * radius,
          lng: baseLng + Math.cos(angle) * radius
        };
      }
      const marker = L.marker(latLng, { icon: this.defaultIcon }).addTo(this.map);
      marker.bindPopup(this.composePopup(property));
      marker.on('click', () => this.propertyFocus.emit(property));
      this.markers.set(property.id, marker);
      bounds.push(latLng);
    }

    this.hasMarkers = this.markers.size > 0;

    if (bounds.length === 1) {
      this.map.setView(bounds[0], Math.max(this.map.getZoom(), 14));
    } else {
      const leafletBounds = L.latLngBounds(bounds);
      this.map.fitBounds(leafletBounds, { padding: [32, 32], maxZoom: 15 });
    }
  }

  private focusActiveMarker(): void {
    if (!this.highlightPropertyId || !this.map) {
      return;
    }

    const marker = this.markers.get(this.highlightPropertyId);
    if (marker) {
      marker.openPopup();
      this.map.panTo(marker.getLatLng());
    }
  }

  private hasCoordinates(property: Property): boolean {
    return typeof property?.location?.lat === 'number' && typeof property?.location?.lng === 'number';
  }

  private composePopup(property: Property): string {
    const price = Number.isFinite(property.price) ? `${Math.round(property.price)} € / μήνα` : '';
    const location = [property.location.city, property.location.address].filter(Boolean).join(', ');
    const detailUrl = `/properties/${encodeURIComponent(property.id)}`;

    return [
      '<div class="property-popup">',
      `<h3>${this.escapeHtml(property.title)}</h3>`,
      location ? `<p>${this.escapeHtml(location)}</p>` : '',
      price ? `<div class="price">${this.escapeHtml(price)}</div>` : '',
      `<a class="popup-link" href="${detailUrl}">Προβολή αγγελίας</a>`,
      '</div>'
    ].join('');
  }

  private escapeHtml(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
