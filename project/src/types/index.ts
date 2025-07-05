export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  balance: number;
  paymentMethod?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  resetPasswordRequired: boolean;
  printers: Printer[];
  printJobs: PrintJob[];
}

export interface Printer {
  id: number;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  owner: User | null;
  queueLength: number;
  blackAndWhiteRate: number;
  colorRate: number;
  ipAddress: string;
  printJobs: PrintJob[];
}

export interface PrintJob {
  id: number;
  userName: string;
  printerName: string;
  documentName: string;
  pageCount: number;
  totalPages: number;
  printType: 'BLACK_AND_WHITE' | 'COLOR';
  pageSize: 'A4' | 'LETTER';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  totalCost: number;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  deliveryOption: 'PICKUP' | 'DELIVERY';
  copyCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PrintJobSubmission {
  printerId: number;
  printType: 'BLACK_AND_WHITE' | 'COLOR';
  pageSize: 'A4' | 'LETTER';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  deliveryOption: 'PICKUP' | 'DELIVERY';
  files: File[];
  copyCount?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}