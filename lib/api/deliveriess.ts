export type DeliveryStatus = "READY_FOR_DELIVERY" | "IN_TRANSIT" | "DELIVERED" | "FAILED"

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
  totalPrice: number
}

export interface Delivery {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate?: string
  status: DeliveryStatus
  notes?: string
  address: string
  products?: Product[]
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  createdAt: string
  updatedAt: string
}

export const getStatusLabel = (status: DeliveryStatus): string => {
  switch (status) {
    case "READY_FOR_DELIVERY":
      return "Prête à livrer"
    case "IN_TRANSIT":
      return "En transit"
    case "DELIVERED":
      return "Livrée"
    case "FAILED":
      return "Échec"
    default:
      return "Inconnu"
  }
}

export const getStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case "READY_FOR_DELIVERY":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "IN_TRANSIT":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "DELIVERED":
      return "bg-green-100 text-green-800 border-green-200"
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const formatDeliveryDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}
