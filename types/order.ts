export interface OrderProduct {
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
  totalPrice: number
}

export interface Order {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate: string | null
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DELIVERED"
  notes?: string
  address: string
  products: OrderProduct[]
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  createdAt: string
  updatedAt: string
}
