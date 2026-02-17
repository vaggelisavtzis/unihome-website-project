import { AvailabilitySchedule } from './availability.model';

export interface PropertyFeature {
  name: string;
  icon?: string;
}

export interface PropertyLocation {
  address: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

export interface PropertyBasics {
  furnished: boolean;
  hasDamage: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'Διαμέρισμα' | 'Γκαρσονιέρα' | 'Σπίτι' | 'Συγκάτοικος' | 'Πώληση';
  price: number;
  area: number;
  rooms: number;
  features: string[];
  images: string[];
  basics: PropertyBasics;
  location: PropertyLocation;
  ownerId: string;
  contact?: {
    name: string;
    phone?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
  };
  createdAt: string;
  availability?: AvailabilitySchedule;
  hospitality?: boolean;
  hospitalityListingId?: string;
  published: boolean;
}
