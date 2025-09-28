// lib/api/products.ts
import { Product, ProductCreateInput, ProductUpdateInput, ProductFilters, ProductsResponse } from '@/types/product';

const API_BASE_URL = '/api/Products';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : null;
  }
  return null;
};

// Helper function to create headers
const createHeaders = (includeAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Get all products with filtering and pagination
export const getProducts = async (filters?: ProductFilters): Promise<ProductsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      if (filters.active !== undefined) {
        queryParams.append('active', filters.active.toString());
      }
      if (filters.available !== undefined) {
        queryParams.append('available', filters.available.toString());
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      if (filters.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
    }

    const url = queryParams.toString() 
      ? `${API_BASE_URL}?${queryParams.toString()}`
      : API_BASE_URL;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get single product by ID
export const getProductById = async (id: string): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Create new product (requires authentication)
export const createProduct = async (productData: ProductCreateInput): Promise<Product> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create product: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product (requires authentication)
export const updateProduct = async (id: string, productData: ProductUpdateInput): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update product: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product (requires authentication)
export const deleteProduct = async (id: string, permanent: boolean = false): Promise<void> => {
  try {
    const url = permanent 
      ? `${API_BASE_URL}/${id}?permanent=true`
      : `${API_BASE_URL}/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete product: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get product categories
export const getProductCategories = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Upload product image (Base64)
export const uploadProductImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
