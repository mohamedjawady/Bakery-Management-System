const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') {
    console.log('getAuthHeaders called during SSR - no token available');
    return {
      'Content-Type': 'application/json',
    };
  }
  
  // Get token from userInfo object in localStorage
  const userInfo = localStorage.getItem('userInfo');
  let token = null;
  
  if (userInfo) {
    try {
      const parsedUserInfo = JSON.parse(userInfo);
      token = parsedUserInfo.token;
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    }
  }
  
  console.log('Token from localStorage userInfo:', token ? 'Found' : 'Not found');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(errorData.message || 'Une erreur est survenue');
  }
  return response.json();
};

// Dashboard Overview
export const getDashboardOverview = async () => {
  console.log('Calling getDashboardOverview...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Dashboard overview response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dashboard overview error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Dashboard overview fetch error:', error);
    throw error;
  }
};

// Sales Chart Data
export const getSalesChartData = async () => {
  console.log('Calling getSalesChartData...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/sales-chart`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Sales chart response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sales chart error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Sales chart fetch error:', error);
    throw error;
  }
};

// Product Performance Data
export const getProductPerformance = async () => {
  console.log('Calling getProductPerformance...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/product-performance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Product performance response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Product performance error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Product performance fetch error:', error);
    throw error;
  }
};

// Bakery Comparison Data
export const getBakeryComparison = async () => {
  console.log('Calling getBakeryComparison...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/bakery-comparison`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Bakery comparison response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bakery comparison error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Bakery comparison fetch error:', error);
    throw error;
  }
};

// Recent Orders
export const getRecentOrders = async () => {
  console.log('Calling getRecentOrders...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Recent orders response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recent orders error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Recent orders fetch error:', error);
    throw error;
  }
};

// Performance Indicators
export const getPerformanceIndicators = async () => {
  console.log('Calling getPerformanceIndicators...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/performance-indicators`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Performance indicators response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Performance indicators error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Performance indicators fetch error:', error);
    throw error;
  }
};

// Export Sales Report
export const exportSalesReport = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${API_BASE_URL}/api/dashboard/export/sales?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(errorData.message || 'Une erreur est survenue');
  }
  
  // Handle file download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition 
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
    : 'rapport-ventes.csv';
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Export Product Report
export const exportProductReport = async () => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/export/products`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(errorData.message || 'Une erreur est survenue');
  }
  
  // Handle file download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition 
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
    : 'rapport-produits.csv';
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Export Financial Report
export const exportFinancialReport = async () => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/export/financial`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(errorData.message || 'Une erreur est survenue');
  }
  
  // Handle file download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition 
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
    : 'rapport-financier.csv';
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Export Weekly Billing
export const exportWeeklyBilling = async (startDate: string, endDate: string) => {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  
  const response = await fetch(`${API_BASE_URL}/api/dashboard/export/weekly-billing?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(errorData.message || 'Une erreur est survenue');
  }
  
  // Handle file download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition 
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
    : 'facturation-hebdomadaire.xlsx';
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
