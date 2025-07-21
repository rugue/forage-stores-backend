export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  path?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  coordinates?: Location;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}
