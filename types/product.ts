// types/product.ts

export interface Product {
  _id: string;
  name: string;
  description: string;
  laboratory: string;
  ingredients: string[];
  unitPrice: number; // Prix HT (Hors Taxe)
  taxRate: number; // Taux de TVA (ex: 0.15 pour 15%)
  unitPriceTTC?: number; // Prix TTC (Toutes Taxes Comprises) - calculé automatiquement
  taxAmount?: number; // Montant de la taxe - calculé automatiquement
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
  laboratory: string;
  ingredients: string[];
  unitPrice: number; // Prix HT (Hors Taxe)
  taxRate?: number; // Taux de TVA (par défaut 15%)
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

// Order types with tax calculations
export interface OrderProduct {
  productName: string;
  laboratory: string;
  unitPriceHT: number; // Prix unitaire HT
  unitPriceTTC: number; // Prix unitaire TTC
  taxRate: number; // Taux de TVA
  quantity: number;
  totalPriceHT: number; // Total HT pour ce produit
  taxAmount: number; // Montant total de la taxe pour ce produit
  totalPriceTTC: number; // Total TTC pour ce produit
}

export interface Order {
  _id?: string;
  orderId: string;
  orderReferenceId: string;
  bakeryName: string;
  deliveryUserId: string;
  deliveryUserName: string;
  scheduledDate: Date | string;
  actualDeliveryDate?: Date | string | null;
  status: string;
  notes?: string;
  address: string;
  products: OrderProduct[];
  totalOrderHT?: number; // Total de la commande HT
  totalTaxAmount?: number; // Total des taxes
  totalOrderTTC?: number; // Total de la commande TTC
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderCreateInput {
  orderReferenceId: string;
  bakeryName: string;
  deliveryUserId: string;
  deliveryUserName: string;
  scheduledDate: Date | string;
  notes?: string;
  address: string;
  products: OrderProduct[];
}

// Utility functions for tax calculations
export const calculateTaxAmount = (priceHT: number, taxRate: number): number => {
  return Number((priceHT * taxRate).toFixed(2));
};

export const calculatePriceTTC = (priceHT: number, taxRate: number): number => {
  return Number((priceHT * (1 + taxRate)).toFixed(2));
};

export const calculateOrderTotals = (products: OrderProduct[]) => {
  const totalOrderHT = products.reduce((sum, product) => sum + product.totalPriceHT, 0);
  const totalTaxAmount = products.reduce((sum, product) => sum + product.taxAmount, 0);
  const totalOrderTTC = products.reduce((sum, product) => sum + product.totalPriceTTC, 0);
  
  return {
    totalOrderHT: Number(totalOrderHT.toFixed(2)),
    totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
    totalOrderTTC: Number(totalOrderTTC.toFixed(2))
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};
