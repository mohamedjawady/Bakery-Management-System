// Frontend API functions for exporting products

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : null;
  }
  return null;
};

export interface ExportOptions {
  format: 'excel' | 'csv';
  title?: string;
  filters?: {
    category?: string;
    active?: boolean;
    available?: boolean;
    search?: string;
  };
}

// Download file from blob
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export products function
export const exportProducts = async (options: ExportOptions): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const { format, title = 'Liste des Produits', filters = {} } = options;
    
    // Build query parameters
    const params = new URLSearchParams({
      format,
      ...(title && { title }),
      ...(filters.category && { category: filters.category }),
      ...(filters.active !== undefined && { active: filters.active.toString() }),
      ...(filters.available !== undefined && { available: filters.available.toString() }),
      ...(filters.search && { search: filters.search }),
    });

    const response = await fetch(`${API_BASE_URL}/products/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'exportation');
    }

    // Get the blob
    const blob = await response.blob();
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    const filename = `produits_${timestamp}.${extension}`;
    
    // Download the file
    downloadFile(blob, filename);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Export products with current filters (for use in components)
export const exportProductsWithFilters = async (
  format: 'excel' | 'csv',
  currentFilters: any,
  title?: string
): Promise<void> => {
  const options: ExportOptions = {
    format,
    title,
    filters: {
      category: currentFilters.category !== 'all' ? currentFilters.category : undefined,
      active: currentFilters.active,
      available: currentFilters.available,
      search: currentFilters.search,
    },
  };

  return exportProducts(options);
};
