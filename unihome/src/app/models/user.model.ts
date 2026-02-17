export type UserRole = 'student' | 'owner';

export interface BaseUser {
  id: string;
  role: UserRole;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number;
  phone?: string;
  createdAt: string;
  favorites: string[];
}

export interface StudentProfile {
  university: string;
  department: string;
  isStudent?: boolean;
}

export interface OwnerProfile {
  address: string;
  vatNumber?: string;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  profile: StudentProfile;
}

export interface OwnerUser extends BaseUser {
  role: 'owner';
  profile: OwnerProfile;
}

export type User = StudentUser | OwnerUser;

export function isStudentUser(user: User | null | undefined): user is StudentUser {
  return !!user && user.role === 'student';
}

export function isOwnerUser(user: User | null | undefined): user is OwnerUser {
  return !!user && user.role === 'owner';
}
