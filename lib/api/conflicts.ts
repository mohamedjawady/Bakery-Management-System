// API functions for conflict/reclamation management

export interface Discrepancy {
  productName: string
  ordered: {
    quantity: number
    unitPrice?: number
    totalPrice?: number
  }
  received: {
    quantity: number
    unitPrice?: number
    totalPrice?: number
    condition?: string
  }
  issueType: 'QUANTITY_MISMATCH' | 'QUALITY_ISSUE' | 'WRONG_PRODUCT' | 'DAMAGED' | 'EXPIRED' | 'MISSING' | 'OTHER'
  notes?: string
}

export interface ConflictReport {
  reportedBy: string
  description: string
  discrepancies: Discrepancy[]
}

export interface ConflictResolution {
  reviewedBy: string
  adminNotes: string
  resolution: 'ACCEPT_AS_IS' | 'PARTIAL_REFUND' | 'FULL_REFUND' | 'REPLACE_ORDER' | 'UPDATE_ORDER'
  correctedProducts?: any[]
  correctedTotalHT?: number
  correctedTaxAmount?: number
  correctedTotalTTC?: number
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : ''

// Report a conflict for an order
export const reportConflict = async (orderId: string, conflictData: ConflictReport, token: string) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/report-conflict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(conflictData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to report conflict')
  }

  return response.json()
}

// Get all orders with conflicts (for admin)
export const getConflictOrders = async (token: string) => {
  const response = await fetch(`${API_BASE}/orders/conflicts/all`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch conflict orders')
  }

  return response.json()
}

// Resolve a conflict (admin action)
export async function resolveConflict(orderId: string, resolution: ConflictResolution, token: string) {
  const response = await fetch(`${API_BASE}/orders/${orderId}/resolve-conflict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resolution),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to resolve conflict")
  }

  return response.json()
}

// Update conflict status
export const updateConflictStatus = async (orderId: string, status: string, token: string) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/conflict-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update conflict status')
  }

  return response.json()
}
