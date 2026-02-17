import { AvailabilitySchedule } from './availability.model';

export type RoommateAdMode =
  | 'HOST_SEEKING_ROOMMATE'
  | 'FINDING_HOME_WITH_ROOMMATE'
  | 'LOOKING_FOR_ROOM'
  | 'VACANCY_NEEDS_ROOMMATE';

export interface RoommateAd {
  id: string;
  title: string;
  description: string;
  monthlyRent: number;
  propertyLocation: string;
  mode: RoommateAdMode;
  availableFrom: string;
  createdAt: string;
  authorId: string;
  preferences: string[];
  propertyFeatures: string[];
  lifestyle?: string[];
  profile?: RoommateProfile;
  location?: RoommateLocation;
  images?: string[];
  amenities?: string[];
  contact?: {
    name: string;
    phone?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
  };
  published?: boolean;
  ratings?: RoommateRating[];
  ratingCount: number;
  averageRating?: number;
  lastRatedAt?: string;
  availability?: AvailabilitySchedule;
}

export interface RoommateProfile {
  name: string;
  age?: number;
  gender?: string;
  university?: string;
  department?: string;
  semester?: string;
  bio?: string;
  avatar?: string;
  interests?: string[];
  habits?: string[];
  isStudent?: boolean;
}

export interface RoommateLocation {
  city: string;
  area?: string;
  proximity?: string;
}

export interface RoommateRating {
  id: string;
  reviewerId: string;
  reviewerName: string;
  score: number;
  comment?: string;
  createdAt: string;
}
