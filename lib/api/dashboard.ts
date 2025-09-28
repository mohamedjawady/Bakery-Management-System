const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

interface DashboardOverview {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalBakeries: number
}

interface SalesChartData {
  date: string
  sales: number
  orders: number
}

interface ProductPerformance {
  productName: string
  sales: number
  quantity: number
}

interface BakeryComparison {
  bakeryName: string
  sales: number
  orders: number
}

interface RecentOrder {
  id: string
  bakeryName: string
  total: number
  date: string
  status: string
}

interface PerformanceIndicator {
  name: string
  value: number
  change: number
}

interface InvoiceHistoryItem {
  id: string
  referenceNumber: string
  bakeryName: string
  weekStart: string
  weekEnd: string
  totalAmount: number
  createdAt: string
  downloadCount: number
}

interface InvoiceHistoryResponse {
  invoices: InvoiceHistoryItem[]
  totalCount: number
  currentPage: number
  totalPages: number
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null

  const userInfo = localStorage.getItem("userInfo")
  if (userInfo) {
    try {
      const parsedUserInfo = JSON.parse(userInfo)
      return parsedUserInfo.token
    } catch (error) {
      console.error("Error parsing userInfo from localStorage:", error)
    }
  }
  return null
}

const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = `HTTP error! status: ${response.status}`

  try {
    const errorData = await response.json()
    errorMessage = errorData.message || errorMessage
  } catch {
    // If response is not JSON, use default error message
  }

  throw new Error(errorMessage)
}

const makeAuthenticatedRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken()

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

const downloadFile = (blob: Blob, response: Response, defaultFilename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url

  const contentDisposition = response.headers.get("Content-Disposition")
  const filename = contentDisposition ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") : defaultFilename

  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

const exportFile = async (endpoint: string, defaultFilename: string, params?: URLSearchParams): Promise<void> => {
  const token = getAuthToken()
  const url = params ? `${API_BASE_URL}${endpoint}?${params}` : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  const blob = await response.blob()
  downloadFile(blob, response, defaultFilename)
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  return makeAuthenticatedRequest<DashboardOverview>("/dashboard/overview")
}

export const getSalesChartData = async (): Promise<SalesChartData[]> => {
  return makeAuthenticatedRequest<SalesChartData[]>("/dashboard/sales-chart")
}

export const getProductPerformance = async (): Promise<ProductPerformance[]> => {
  return makeAuthenticatedRequest<ProductPerformance[]>("/dashboard/product-performance")
}

export const getBakeryComparison = async (): Promise<BakeryComparison[]> => {
  return makeAuthenticatedRequest<BakeryComparison[]>("/dashboard/bakery-comparison")
}

export const getRecentOrders = async (): Promise<RecentOrder[]> => {
  return makeAuthenticatedRequest<RecentOrder[]>("/dashboard/recent-orders")
}

export const getPerformanceIndicators = async (): Promise<PerformanceIndicator[]> => {
  return makeAuthenticatedRequest<PerformanceIndicator[]>("/dashboard/performance-indicators")
}

export const exportSalesReport = async (startDate?: string, endDate?: string): Promise<void> => {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)

  await exportFile("/dashboard/export/sales", "rapport-ventes.csv", params)
}

export const exportProductReport = async (): Promise<void> => {
  await exportFile("/dashboard/export/products", "rapport-produits.csv")
}

export const exportFinancialReport = async (): Promise<void> => {
  await exportFile("/dashboard/export/financial", "rapport-financier.csv")
}

const generateWeekFilename = (startDate: string, endDate: string): string => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const year = start.getFullYear()
  const startDay = start.getDate().toString().padStart(2, "0")
  const startMonth = (start.getMonth() + 1).toString().padStart(2, "0")
  const endDay = end.getDate().toString().padStart(2, "0")
  const endMonth = (end.getMonth() + 1).toString().padStart(2, "0")

  return `${year}-${startDay}${startMonth}-${endDay}${endMonth}.xlsx`
}

export const exportWeeklyBilling = async (startDate: string, endDate: string): Promise<void> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    includeBakeryInfo: "true",
  })

  const filename = generateWeekFilename(startDate, endDate)
  await exportFile("/dashboard/export/weekly-billing", filename, params)
}

export const regenerateInvoice = async (referenceNumber: string): Promise<void> => {
  const invoiceDetails = await makeAuthenticatedRequest<{
    weekStart: string
    weekEnd: string
    bakeryName: string
  }>(`/dashboard/invoices/${referenceNumber}/details`)

  const filename = generateWeekFilename(invoiceDetails.weekStart, invoiceDetails.weekEnd)
  await exportFile(`/dashboard/invoices/${referenceNumber}/regenerate`, filename)
}

export const generateNewInvoice = async (
  startDate: string,
  endDate: string,
  bakeryName: string,
): Promise<{ referenceNumber: string }> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/invoices/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
    },
    body: JSON.stringify({
      startDate,
      endDate,
      bakeryName,
      includeBakeryInfo: true,
    }),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  const result = await response.json()

  const filename = generateWeekFilename(startDate, endDate)
  const blob = await response.blob()
  downloadFile(blob, response, filename)

  return result
}

export const getInvoiceHistory = async (
  page = 1,
  limit = 20,
  bakeryName?: string,
  year?: number,
): Promise<InvoiceHistoryResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (bakeryName) params.append("bakeryName", bakeryName)
  if (year) params.append("year", year.toString())

  return makeAuthenticatedRequest<InvoiceHistoryResponse>(`/dashboard/invoices?${params}`)
}
