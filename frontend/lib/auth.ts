import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'PRO_CONTRACTOR' | 'ADMIN';
  phone_number: string;
  date_joined: string;
  is_verified_pro_contractor?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role: 'CUSTOMER' | 'PRO_CONTRACTOR' | 'ADMIN';
  phone_number: string;
}

export interface LoginData {
  username: string;
  password: string;
}

// Token Management
const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'user_data',
};

// Token storage utilities
export const tokenManager = {
  setTokens: (tokens: AuthTokens, user: User) => {
    // Store tokens in cookies (more secure than localStorage)
    Cookies.set(TOKEN_KEYS.ACCESS, tokens.access, {
      expires: 1, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    Cookies.set(TOKEN_KEYS.REFRESH, tokens.refresh, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // Store user data in localStorage (non-sensitive data)
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },
  
  getTokens: (): AuthTokens | null => {
    const access = Cookies.get(TOKEN_KEYS.ACCESS);
    const refresh = Cookies.get(TOKEN_KEYS.REFRESH);
    
    if (access && refresh) {
      return { access, refresh };
    }
    return null;
  },
  
  getUser: (): User | null => {
    try {
      const userData = localStorage.getItem(TOKEN_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  
  clearTokens: () => {
    Cookies.remove(TOKEN_KEYS.ACCESS);
    Cookies.remove(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = tokenManager.getTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokens = tokenManager.getTokens();
        if (tokens?.refresh) {
          const response = await refreshToken(tokens.refresh);
          tokenManager.setTokens(response, tokenManager.getUser()!);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Functions
export const authAPI = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response: AxiosResponse<RegisterResponse> = await api.post('/accounts/register/', data);
    return response.data;
  },
  
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/accounts/login/', data);
    return response.data;
  },
  
  logout: async (refreshToken: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/accounts/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response: AxiosResponse<AuthTokens> = await api.post('/accounts/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/accounts/profile/');
    return response.data;
  },
};

// Helper function for token refresh
const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  const response: AxiosResponse<AuthTokens> = await axios.post(
    `${API_BASE_URL}/accounts/refresh/`,
    { refresh: refreshToken }
  );
  return response.data;
};

export default api;
