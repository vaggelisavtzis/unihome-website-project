import { AvailabilitySchedule } from './availability.model';

export interface TemporaryStayLocation {
  address: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

export interface TemporaryStayContact {
  name: string;
  phone: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

export type TemporaryStayType = 'Ξενοδοχείο' | 'Δωμάτιο' | 'Airbnb' | 'Hostel' | 'Φιλοξενία';

export type TemporaryStayCostCategory = 'free' | 'paid';

export type TemporaryStayPurpose = 'hospitality' | 'accommodation';

export interface TemporaryStay {
  id: string;
  title: string;
  description: string;
  type: TemporaryStayType;
  pricePerNight: number;
  minNights: number;
  costCategory: TemporaryStayCostCategory;
  location: TemporaryStayLocation;
  amenities: string[];
  images: string[];
  contact: TemporaryStayContact;
  createdAt: string;
  availability?: AvailabilitySchedule;
  purpose: TemporaryStayPurpose;
  linkedPropertyId?: string;
  published?: boolean;
}
