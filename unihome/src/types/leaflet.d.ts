declare module 'leaflet' {
  export interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  export type LatLngExpression = LatLngLiteral | [number, number];

  export interface LeafletMouseEvent {
    latlng: LatLngLiteral;
  }

  export interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
  }

  export interface Map {
    remove(): void;
    on(event: 'click', handler: (event: LeafletMouseEvent) => void): Map;
    setView(center: LatLngExpression, zoom?: number, options?: Record<string, unknown>): Map;
    invalidateSize(): Map;
    fitBounds(bounds: LatLngBounds | LatLngExpression[], options?: { padding?: [number, number]; maxZoom?: number }): Map;
    panTo(center: LatLngExpression): Map;
    getZoom(): number;
  }

  export interface TileLayer {
    addTo(map: Map): TileLayer;
  }

  export interface IconOptions {
    iconUrl: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    shadowSize?: [number, number];
  }

  export interface Icon {}

  export interface Marker {
    setLatLng(latlng: LatLngExpression): Marker;
    addTo(map: Map): Marker;
    removeFrom(map?: Map): Marker;
    bindPopup(html: string): Marker;
    openPopup(): Marker;
    getLatLng(): LatLngLiteral;
    on(event: 'click', handler: () => void): Marker;
  }

  export function icon(options: IconOptions): Icon;
  export function marker(latlng: LatLngExpression, options?: { icon?: Icon }): Marker;
  export function map(element: HTMLElement, options?: MapOptions): Map;
  export function tileLayer(urlTemplate: string, options?: Record<string, unknown>): TileLayer;

  export interface LatLngBounds {
    extend(point: LatLngExpression): LatLngBounds;
  }

  export function latLngBounds(points: LatLngExpression[]): LatLngBounds;
}
