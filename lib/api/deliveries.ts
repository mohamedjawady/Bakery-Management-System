// Delivery API service for frontend
const API_BASE_URL = '/api/deliveries';

// Types
export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'READY_FOR_DELIVERY' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export interface Delivery {
  _id: string;
  orderId: string;
  orderReferenceId: string;
  bakeryName: string;
  deliveryUserId: string;
  deliveryUserName: string;
  scheduledDate: string;
  actualDeliveryDate?: string | null;
  status: DeliveryStatus;
  notes?: string;
  address: string;
  products: Array<{
    productName: string;
    pricePerUnit: number;
    quantity: number;
    totalPrice: number;
    totalPriceTTC: number;

  }>;
  createdAt: string;
  updatedAt: string;
  orderTotalHT?: number;
  orderTaxAmount?: number;
  orderTotalTTC?: number;
}

export interface DeliveryUpdateRequest {
  status: Delivery['status'];
  notes?: string;
}

export interface DeliveryAssignRequest {
  deliveryUserId: string;
  deliveryUserName: string;
}

export interface DeliveryClaimRequest {
  deliveryUserId: string;
  deliveryUserName: string;
}

export interface DeliveryReleaseRequest {
  reason?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class DeliveryAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('Making delivery API request to:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Get all deliveries
  async getAllDeliveries(): Promise<Delivery[]> {
    return this.request<Delivery[]>('/');
  }

  // Get available orders for claiming
  async getAvailableOrders(): Promise<Delivery[]> {
    return this.request<Delivery[]>('/available');
  }

  // Get deliveries by status
  async getDeliveriesByStatus(status: Delivery['status']): Promise<Delivery[]> {
    return this.request<Delivery[]>(`/status/${status}`);
  }

  // Get deliveries by user
  async getDeliveriesByUser(userId: string): Promise<Delivery[]> {
    return this.request<Delivery[]>(`/user/${userId}`);
  }

  // Get single delivery
  async getDeliveryById(id: string): Promise<Delivery> {
    return this.request<Delivery>(`/${id}`);
  }

  // Update delivery status
  async updateDeliveryStatus(id: string, updateData: DeliveryUpdateRequest): Promise<Delivery> {
    return this.request<Delivery>(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Assign delivery to user
  async assignDeliveryUser(id: string, assignData: DeliveryAssignRequest): Promise<Delivery> {
    return this.request<Delivery>(`/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(assignData),
    });
  }

  // Claim an order for delivery (self-assignment)
  async claimOrder(id: string, claimData: DeliveryClaimRequest): Promise<{ message: string; order: Delivery }> {
    return this.request<{ message: string; order: Delivery }>(`/${id}/claim`, {
      method: 'PATCH',
      body: JSON.stringify(claimData),
    });
  }

  // Release an order (unclaim)
  async releaseOrder(id: string, releaseData: DeliveryReleaseRequest): Promise<{ message: string; order: Delivery }> {
    return this.request<{ message: string; order: Delivery }>(`/${id}/release`, {
      method: 'PATCH',
      body: JSON.stringify(releaseData),
    });
  }

  // Mark delivery as completed
  async markDeliveryCompleted(id: string, notes?: string): Promise<{ message: string; delivery: Delivery }> {
    return this.request<{ message: string; delivery: Delivery }>(`/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  // Get delivery statistics
  async getDeliveryStats(): Promise<{
    total: number;
    ready: number;
    inTransit: number;
    delivered: number;
    failed: number;
  }> {
    try {
      const deliveries = await this.getAllDeliveries();

      return {
        total: deliveries.length,
        ready: deliveries.filter(d => d.status === 'READY_FOR_DELIVERY').length,
        inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
        delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
        failed: deliveries.filter(d => d.status === 'FAILED').length,
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deliveryApi = new DeliveryAPI();

// Helper functions
export const getStatusLabel = (status: Delivery['status']): string => {
  const labels: Record<Delivery['status'], string> = {
    'PENDING': 'En attente',
    'IN_PROGRESS': 'En cours',
    'READY_FOR_DELIVERY': 'Prêt pour livraison',
    'IN_TRANSIT': 'En transit',
    'DELIVERED': 'Livré',
    'FAILED': 'Échoué',
    'CANCELLED': 'Annulé',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: Delivery['status']): string => {
  const colors: Record<Delivery['status'], string> = {
    'PENDING': 'bg-gray-50 text-gray-700 border-gray-200',
    'IN_PROGRESS': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'READY_FOR_DELIVERY': 'bg-blue-50 text-blue-700 border-blue-200',
    'IN_TRANSIT': 'bg-amber-50 text-amber-700 border-amber-200',
    'DELIVERED': 'bg-green-50 text-green-700 border-green-200',
    'FAILED': 'bg-red-50 text-red-700 border-red-200',
    'CANCELLED': 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export const formatDeliveryDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Non défini';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
