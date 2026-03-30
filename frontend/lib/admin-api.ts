// Admin API functions for dashboard statistics and management
import { apiClient } from './api';
import Cookies from 'js-cookie';

// Admin API client for authenticated admin endpoints
const adminApiClient = {
  request: async (endpoint: string, options: any = {}) => {
    // Use the same token retrieval method as main API client
    const getAuthToken = (): string | null => {
      if (typeof window !== 'undefined') {
        // Try to get token from cookies first (auth.ts uses cookies)
        const token = Cookies.get('access_token');
        if (token) {
          return token;
        }
        
        // Fallback to localStorage/sessionStorage for backward compatibility
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      }
      return null;
    };

    const token = getAuthToken();
    if (!token) {
      console.error('Admin authentication required - no token found');
      throw new Error('Admin authentication required');
    }
    
    console.log('Admin API request with token:', token.substring(0, 20) + '...');
    
    return apiClient.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  low_stock_items: number;
  recent_orders: Order[];
  low_stock_products: Product[];
}

export interface Order {
  id: string;
  order_number: string;
  customer: {
    id: number;
    username: string;
    email: string;
  };
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  escrow_status: 'awaiting_payment' | 'held' | 'released' | 'non_escrow';
  payment_method: 'cod' | 'card' | 'mobile_money';
  created_at: string;
  items_count: number;
}

// Import the enhanced Product interface from our types
import { Product } from '@/types/product';

// Re-export for backward compatibility
export type { Product };

// Define Order interface since it's not in types/product.ts
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  escrow_status: 'awaiting_payment' | 'held' | 'released' | 'non_escrow';
  payment_method: 'cod' | 'card' | 'mobile_money';
  created_at: string;
  items_count: number;
  release_code?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  compare_price: string | null;
  cost_price: string | null;
  barcode: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: string | null;
  dimensions: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  images: {
    id: number;
    image: string;
    alt_text: string;
  }[];
  specifications: Record<string, string>;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  // Dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    return await apiClient.request('/admin/dashboard/stats/');
  },

  // Orders management
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ results: Order[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/orders/', { params });
  },

  getOrder: async (orderId: string): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`);
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`, {
      method: 'PATCH',
      data: { status }
    });
  },

  updateOrderWithFundsVerified: async (orderId: string, data: {
    status: string;
    escrow_status: 'awaiting_payment' | 'held' | 'released' | 'non_escrow';
    payment_ref: string;
    release_code: string;
  }): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`, {
      method: 'PATCH',
      data
    });
  },

  // Product management (using admin endpoints)
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    is_active?: string;
    is_featured?: string;
  }): Promise<{count: number, num_pages: number, current_page: number, results: Product[]}> => {
    return await adminApiClient.request('/products/', {
      method: 'GET',
      params
    }) as {count: number, num_pages: number, current_page: number, results: Product[]};
  },

  getProductDetail: async (productId: number): Promise<Product> => {
    return await adminApiClient.request(`/products/${productId}/`, {
      method: 'GET'
    }) as Product;
  },

  updateProduct: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    return await adminApiClient.request(`/products/${productId}/update/`, {
      method: 'PATCH',
      data: productData
    }) as Product;
  },

  deleteProduct: async (productId: number): Promise<{message: string}> => {
    return await adminApiClient.request(`/products/${productId}/delete/`, {
      method: 'DELETE'
    }) as {message: string};
  },

  // Inventory management
  getInventory: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    stock_status?: string;
  }): Promise<{ results: Product[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/inventory/', { params });
  },

  updateStock: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    return await apiClient.request(`/admin/inventory/${productId}/`, {
      method: 'PATCH',
      data: productData
    });
  },

  restockProduct: async (productId: number, addQuantity: number): Promise<Product> => {
    return await apiClient.request(`/admin/inventory/${productId}/restock/`, {
      method: 'PATCH',
      data: { add_quantity: addQuantity }
    });
  },

  // Customers management
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{ results: any[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/customers/', { params });
  },

  getCustomer: async (customerId: number): Promise<any> => {
    return await apiClient.request(`/admin/customers/${customerId}/`);
  },

  // Analytics
  getSalesAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any> => {
    return await apiClient.request('/admin/analytics/sales/', { params });
  },

  getTopProducts: async (params?: {
    limit?: number;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any[]> => {
    return await apiClient.request('/admin/analytics/top-products/', { params });
  },

  getTopCustomers: async (params?: {
    limit?: number;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any[]> => {
    return await apiClient.request('/admin/analytics/top-customers/', { params });
  },
};
