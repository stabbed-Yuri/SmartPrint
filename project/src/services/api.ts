import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User, Printer, PrintJob, PrintJobSubmission } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  // Use relative paths in development (with Vite proxy) and full URL in production
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding Authorization header with token for URL:', config.url);
    } else {
      console.log('No token found in localStorage for URL:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ApiService {
  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await api.get('/users/me');
    return response.data;
  }

  async getUserJobs(): Promise<PrintJob[]> {
    const response: AxiosResponse<PrintJob[]> = await api.get('/users/my-jobs');
    return response.data;
  }

  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await api.get('/users');
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await api.post('/users', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}`);
  }

  // Printer endpoints
  async getPrinters(): Promise<Printer[]> {
    const response: AxiosResponse<Printer[]> = await api.get('/printers');
    return response.data;
  }

  async getPrinter(id: number): Promise<Printer> {
    const response: AxiosResponse<Printer> = await api.get(`/printers/${id}`);
    return response.data;
  }

  async deletePrinter(id: number): Promise<void> {
    await api.delete(`/printers/${id}`);
  }

  async getPrinterStatus(id?: number): Promise<unknown> {
    const url = id ? `/printers/${id}/status` : '/printer-status';
    const response = await api.get(url);
    return response.data;
  }

  async updatePrinterStatus(id: number, status: unknown): Promise<void> {
    await api.post(`/printers/${id}/status`, status);
  }

  async connectToPrinter(id: number): Promise<void> {
    await api.post(`/printers/${id}/connect`);
  }

  // Print job endpoints
  async getPrintJobs(): Promise<PrintJob[]> {
    const response: AxiosResponse<PrintJob[]> = await api.get('/print/jobs');
    return response.data;
  }

  async getPrintJob(id: number): Promise<PrintJob> {
    const response: AxiosResponse<PrintJob> = await api.get(`/print/jobs/${id}`);
    return response.data;
  }

  async submitPrintJob(jobData: PrintJobSubmission): Promise<PrintJob> {
    const formData = new FormData();
    
    // Add files
    jobData.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add other data
    formData.append('printerId', jobData.printerId.toString());
    formData.append('printType', jobData.printType);
    formData.append('pageSize', jobData.pageSize);
    formData.append('orientation', jobData.orientation);
    formData.append('deliveryOption', jobData.deliveryOption);
    formData.append('copyCount', (jobData.copyCount || 1).toString());

    const response: AxiosResponse<PrintJob> = await api.post('/print', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async calculatePrintCost(jobData: PrintJobSubmission): Promise<{ cost: number; totalPages: number; copyCount: number; costPerCopy: number }> {
    const formData = new FormData();
    
    jobData.files.forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('printerId', jobData.printerId.toString());
    formData.append('printType', jobData.printType);
    formData.append('pageSize', jobData.pageSize);
    formData.append('orientation', jobData.orientation);
    formData.append('copyCount', (jobData.copyCount || 1).toString());

    const response = await api.post('/print/calculate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Test endpoints
  async healthCheck(): Promise<string> {
    const response = await api.get('/test/ping');
    return response.data;
  }

  // Payment endpoints
  async addFunds(amount: number, paymentMethod: string): Promise<unknown> {
    const response = await api.post('/payment/add-funds', {
      amount,
      paymentMethod
    });
    return response.data;
  }

  async getQuickAmounts(): Promise<{ amounts: number[]; currency: string }> {
    const response = await api.get('/payment/quick-amounts');
    return response.data;
  }
}

export const apiService = new ApiService();

export default api;