export type BiographerStatus = 'pending' | 'active' | 'inactive';

export interface Biographer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  intro: string;
  specialties: string[];
  experience: number;
  status: BiographerStatus;
  createdAt: string;
}

export interface BiographerFormData {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  intro: string;
  specialties: string[];
  experience: number;
  status: BiographerStatus;
}
