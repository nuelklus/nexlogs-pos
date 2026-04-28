import { apiClient } from './api';

export interface InventoryTransaction {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    current_stock: number;
  };
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface StockAlert {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    current_stock: number;
  };
  alert_type: string;
  current_stock: number;
  threshold: number;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface ProductApproval {
  id: number;
  product: {
    id: number | null;
    name: string;
    sku: string;
  };
  change_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  requested_by: string;
  requested_at: string;
}

export interface InventoryOverview {
  overview: {
    total_products: number;
    active_products: number;
    in_stock: number;
    out_of_stock: number;
    low_stock: number;
    total_warehouses: number;
    active_alerts: number;
    pending_approvals: number;
  };
  warehouse_stock: {
    total_stock: number;
    total_value: number;
  };
  recent_transactions: InventoryTransaction[];
  top_products: Array<{
    product__name: string;
    product__sku: string;
    total_sold: number;
    revenue: number;
  }>;
  category_value: Array<{
    category: string;
    total_products: number;
    total_stock: number;
    total_value: number;
  }>;
}

export const adminInventoryApi = {
  
  getInventoryOverview: async (): Promise<InventoryOverview> => {
    const response = await apiClient.request<InventoryOverview>('/admin/inventory/overview/', {
      method: 'GET',
    });
    return response;
  },

  getInventoryTransactions: async (params?: {
    page?: number;
    page_size?: number;
    product_id?: number;
    transaction_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    results: InventoryTransaction[];
    count: number;
    num_pages: number;
    current_page: number;
    has_next: boolean;
    has_previous: boolean;
  }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.request(`/admin/inventory/transactions/?${queryParams}`, {
      method: 'GET',
    });
    return response as {
      results: InventoryTransaction[];
      count: number;
      num_pages: number;
      current_page: number;
      has_next: boolean;
      has_previous: boolean;
    };
  },

  createInventoryTransaction: async (data: {
    product_id: number;
    transaction_type: string;
    quantity_change: number;
    reference?: string;
    notes?: string;
  }): Promise<{ id: number; message: string }> => {
    const response = await apiClient.request('/admin/inventory/transactions/create/', {
      method: 'POST',
      data,
    });
    return response as { id: number; message: string };
  },

  getStockAlerts: async (params?: {
    is_resolved?: boolean;
    alert_type?: string;
  }): Promise<StockAlert[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.request(`/admin/inventory/alerts/?${queryParams}`, {
      method: 'GET',
    });
    return response as StockAlert[];
  },

  resolveStockAlert: async (alertId: number): Promise<{ message: string }> => {
    const response = await apiClient.request(`/admin/inventory/alerts/${alertId}/resolve/`, {
      method: 'POST',
    });
    return response as { message: string };
  },

  getPendingApprovals: async (): Promise<ProductApproval[]> => {
    const response = await apiClient.request('/admin/approvals/pending/', {
      method: 'GET',
    });
    return response as ProductApproval[];
  },

  processApproval: async (
    approvalId: number,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.request(`/admin/approvals/${approvalId}/process/`, {
      method: 'POST',
      data: {
        action,
        notes,
      },
    });
    return response as { message: string };
  },
};
