// types/order.d.ts
// Defines the TypeScript interfaces for your Order and Product data,
// based on the Mongoose schema you provided.

export interface Product {
  productName: string
  productRef?: string
  laboratory: string
  unitPriceHT: number
  unitPriceTTC: number
  taxRate: number
  quantity: number
  totalPriceHT: number
  taxAmount: number
  totalPriceTTC: number
  totalPrice: number // For backward compatibility, same as totalPriceTTC
}

export interface Order {
  _id: string // Mongoose adds _id
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string // Will be a Date object, but fetched as string from API
  actualDeliveryDate: string | null
  status: string
  notes?: string
  address: string
  products: Product[]
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  createdAt: string
  updatedAt: string
}
