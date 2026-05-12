import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for POS API
export interface POSAuth {
  username: string;
  password: string;
  store_id: string;
  device_id: string;
}

export interface POSAuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  store_id: string;
  device_id: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  price: string;
  stock_quantity: number;
  pos_stock_quantity: number;
  last_pos_sync?: string;
  pos_store_id: string;
  stock_sync_version: number;
  stock_update_source: string;
  stock_updated_by?: string;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  image_url?: string;
  is_active: boolean;
}

export interface StockUpdateRequest {
  product_id: string;
  quantity: number;
  change_amount?: number;
  store_id?: string;
  device_id?: string;
  sync_version?: number;
}

export interface StockUpdateResponse {
  status: string;
  product_id: string;
  product_name: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  sync_version: number;
  sync_log_id: string;
  timestamp: string;
}

export interface BulkStockUpdateRequest {
  updates: StockUpdateRequest[];
  store_id?: string;
  device_id?: string;
}

export interface BulkStockUpdateResponse {
  results: Array<{
    product_id: string;
    status: string;
    new_quantity: number;
    sync_version: number;
  }>;
  errors: Array<{
    product_id: string;
    error: string;
  }>;
  processed: number;
  successful: number;
  failed: number;
}

export interface SyncStatusResponse {
  store_id: string;
  pending_syncs: number;
  failed_syncs: number;
  recent_logs: Array<{
    id: string;
    product_id: string;
    product_name: string;
    old_quantity: number;
    new_quantity: number;
    change_amount: number;
    source: string;
    operator: string;
    sync_status: string;
    timestamp: string;
  }>;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: string;
  category_name: string;
  brand_name: string;
  image_url?: string;
}

export interface LowStockAlertResponse {
  store_id: string;
  threshold: number;
  count: number;
  products: LowStockAlert[];
}

export interface POSHealthResponse {
  status: string;
  timestamp: string;
  user: string;
  version: string;
}

class POSApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_POS_API_URL || 'http://localhost:8000/api';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('pos_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add device ID header if available
        const deviceId = localStorage.getItem('pos_device_id');
        if (deviceId) {
          config.headers['X-POS-Device-ID'] = deviceId;
        }
        
        console.log(`🔧 POS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ POS API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ POS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = localStorage.getItem('pos_access_token');
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        console.error('❌ POS API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async authenticate(credentials: POSAuth): Promise<POSAuthResponse> {
    try {
      const response = await this.axiosInstance.post('/pos/auth/login/', credentials);
      const data = response.data;
      
      // Store tokens
      localStorage.setItem('pos_access_token', data.access);
      localStorage.setItem('pos_refresh_token', data.refresh);
      localStorage.setItem('pos_device_id', credentials.device_id);
      localStorage.setItem('pos_store_id', data.store_id || credentials.store_id);
      
      return data;
    } catch (error) {
      console.error('❌ POS Authentication failed:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('pos_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.axiosInstance.post('/auth/refresh/', {
        refresh: refreshToken
      });
      
      const newAccessToken = response.data.access;
      localStorage.setItem('pos_access_token', newAccessToken);
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('pos_access_token');
    localStorage.removeItem('pos_refresh_token');
    localStorage.removeItem('pos_device_id');
    localStorage.removeItem('pos_store_id');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('pos_access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Product methods
  async getProducts(params?: {
    store_id?: string;
    barcode?: string;
    search?: string;
  }): Promise<{ results: Product[]; count: number; store_id: string }> {
    const response = await this.axiosInstance.get('/pos/products/', { params });
    return response.data;
  }

  async getProductByBarcode(barcode: string, storeId?: string): Promise<Product | null> {
    try {
      const response = await this.axiosInstance.get('/pos/products/', {
        params: { barcode, store_id: storeId }
      });
      const products = response.data.results;
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error('❌ Failed to get product by barcode:', error);
      return null;
    }
  }

  async searchProducts(query: string, storeId?: string): Promise<Product[]> {
    const response = await this.axiosInstance.get('/pos/products/', {
      params: { search: query, store_id: storeId }
    });
    return response.data.results;
  }

  // Stock management methods
  async updateStock(request: StockUpdateRequest): Promise<StockUpdateResponse> {
    const response = await this.axiosInstance.post('/pos/products/update_stock/', request);
    return response.data;
  }

  async bulkUpdateStock(request: BulkStockUpdateRequest): Promise<BulkStockUpdateResponse> {
    const response = await this.axiosInstance.post('/pos/products/bulk_stock_update/', request);
    return response.data;
  }

  // Sync and monitoring methods
  async getSyncStatus(storeId?: string): Promise<SyncStatusResponse> {
    const response = await this.axiosInstance.get('/pos/products/sync_status/', {
      params: { store_id: storeId }
    });
    return response.data;
  }

  async getLowStockAlerts(threshold: number = 5, storeId?: string): Promise<LowStockAlertResponse> {
    const response = await this.axiosInstance.get('/pos/alerts/low-stock/', {
      params: { threshold, store_id: storeId }
    });
    return response.data;
  }

  async healthCheck(): Promise<POSHealthResponse> {
    const response = await this.axiosInstance.get('/pos/health/');
    return response.data;
  }

  async createTransaction(transactionData: any): Promise<any> {
    const response = await this.axiosInstance.post('/pos/transactions/create/', transactionData);
    return response.data;
  }

  async getTransactionHistory(): Promise<any[]> {
    const response = await this.axiosInstance.get('/pos/transactions/');
    return response.data;
  }

  async getTransactionDetail(transactionId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/pos/transactions/${transactionId}/`);
    return response.data;
  }

  async createRefund(refundData: any): Promise<any> {
    const response = await this.axiosInstance.post('/pos/refunds/', refundData);
    return response.data;
  }

  // Utility methods
  getStoreId(): string {
    return localStorage.getItem('pos_store_id') || 'main';
  }

  getDeviceId(): string {
    return localStorage.getItem('pos_device_id') || 'unknown';
  }

  getCurrentUser(): string | null {
    const token = localStorage.getItem('pos_access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username;
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
export const posApiClient = new POSApiClient();

// Export types
export type {
  POSAuth,
  POSAuthResponse,
  Product,
  StockUpdateRequest,
  StockUpdateResponse,
  BulkStockUpdateRequest,
  BulkStockUpdateResponse,
  SyncStatusResponse,
  LowStockAlert,
  LowStockAlertResponse,
  POSHealthResponse
};
