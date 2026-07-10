export type BiographerStatus = 'pending' | 'active' | 'inactive';

export interface BiographerService {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface BiographerCase {
  id: string;
  title: string;
  cover?: string;
  summary: string;
}

export interface Biographer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  city?: string;
  intro: string;
  title?: string;
  specialties: string[];
  experience: number;
  serviceAreas?: string[];
  education?: string;
  certificates?: string[];
  tags?: string[];
  services?: BiographerService[];
  cases?: BiographerCase[];
  status: BiographerStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BiographerFormData {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  city?: string;
  intro: string;
  title?: string;
  specialties: string[];
  experience: number;
  serviceAreas?: string[];
  education?: string;
  certificates?: string[];
  tags?: string[];
  services?: BiographerService[];
  cases?: BiographerCase[];
  status: BiographerStatus;
}
