// types/product.ts

export interface Product {
  _id: string;
  name: string;
  description: string;
  ingredients: string[];
  unitPrice: number;
  active: boolean;
  category: string;
  image?: string;
  notes?: string;
  isAvailable: boolean;
  preparationTime?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  ingredients: string[];
  unitPrice: number;
  category?: string;
  image?: string;
  notes?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  active?: boolean;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductFilters {
  category?: string;
  active?: boolean;
  available?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
  message?: string;
}

// Product categories enum for type safety
export enum ProductCategory {
  BREAD = 'bread',
  PASTRY = 'pastry',
  CAKE = 'cake',
  VIENNOISERIE = 'viennoiserie',
  SANDWICH = 'sandwich',
  DESSERT = 'dessert',
  GENERAL = 'general'
}

// Form-specific types
export interface ProductFormData extends Omit<ProductCreateInput, 'ingredients'> {
  ingredients: string; // For form input as comma-separated string
}

export interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  showActions?: boolean;
  role?: 'admin' | 'bakery' | 'laboratory' | 'delivery';
}

export interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'create';
  categories?: string[];
  onSave?: (product: ProductCreateInput | ProductUpdateInput) => void;
}

export interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: string[];
  isLoading?: boolean;
  showAvailabilityFilter?: boolean;
  showActiveFilter?: boolean;
}

export interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  isLoading?: boolean;
}
