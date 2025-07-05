import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('Attempting login with credentials:', credentials.email);
      const response: AuthResponse = await apiService.login(credentials);
      console.log('Login response received:', response);
      
      const tokenKey = import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token';
      localStorage.setItem(tokenKey, response.token);
      console.log('Token stored in localStorage with key:', tokenKey);
      
      setUser(response.user);
      console.log('User state updated:', response.user);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response: AuthResponse = await apiService.register(data);
      localStorage.setItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token', response.token);
      setUser(response.user);
      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const tokenKey = import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token';
      const token = localStorage.getItem(tokenKey);
      console.log('Attempting to refresh user with token:', token ? 'present' : 'missing');
      
      const userData = await apiService.getCurrentUser();
      console.log('User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token');
      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          localStorage.removeItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'smartprint_token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};