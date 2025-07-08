"use client"

import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, CookingPot, PackageCheck, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface OrderProduct {
  productName: string
  pricePerUnit: number
  quantity: number
  totalPrice: number
  laboratory?: string
}

interface ProductionOrder {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate?: string
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY"
  notes?: string
  address: string
  products: OrderProduct[]
  createdAt: string
  updatedAt: string
}

interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  labName: string
  lastName: string
  role: string
  token: string
}

const KanbanColumn = ({
  title,
  orders,
  status,
  onUpdateStatus,
  icon: Icon,
  isUpdating,
}: {
  title: string
  orders: ProductionOrder[]
  status: ProductionOrder["status"]
  onUpdateStatus: (orderId: string, newStatus: ProductionOrder["status"]) => void
  icon: React.ElementType
  isUpdating: boolean
}) => {
  const filteredOrders = orders.filter((order) => order.status === status)

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>
            {title} ({filteredOrders.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4 h-[calc(100vh-220px)] overflow-y-auto">
        {filteredOrders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune commande ici.</p>
        )}
        {filteredOrders.map((order) => (
          <Card key={order._id} className="bg-muted/30 dark:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{order.orderReferenceId}</CardTitle>
                <Badge
                  variant={
                    order.status === "PENDING" ? "outline" : order.status === "IN_PROGRESS" ? "secondary" : "default" // READY_FOR_DELIVERY
                  }
                >
                  {order.bakeryName}
                </Badge>
              </div>
              <CardDescription>
                {new Date(order.scheduledDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-3">
              <p className="font-medium mb-1">Articles:</p>
              <ul className="list-disc list-inside pl-1 space-y-1 max-h-24 overflow-y-auto">
                {order.products.map((product, index) => (
                  <li key={index} className="text-xs">
                    {product.productName} <span className="font-semibold">x{product.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-muted-foreground mt-2">
                <p>Livreur: {order.deliveryUserName}</p>
                <p>Adresse: {order.address}</p>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
              {order.status === "PENDING" && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onUpdateStatus(order._id, "IN_PROGRESS")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Démarrer Production <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => onUpdateStatus(order._id, "READY_FOR_DELIVERY")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Marquer comme Prêt <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              {order.status === "READY_FOR_DELIVERY" && (
                <p className="text-xs text-green-600 flex items-center w-full justify-center">
                  <PackageCheck className="mr-2 h-4 w-4" /> Prêt pour livraison
                </p>
              )}
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

export default function LaboratoryProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  const getUserFromStorage = (): UserData | null => {
    try {
      const userStr = localStorage.getItem("userInfo")
      if (!userStr) return null
      return JSON.parse(userStr) as UserData
    } catch (err) {
      console.error("Error parsing user data from localStorage:", err)
      return null
    }
  }

  const filterOrdersByLab = (orders: ProductionOrder[], labName: string): ProductionOrder[] => {
    return orders.filter((order) => order.products.some((product) => product.laboratory === labName))
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://localhost:5000/orders", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Filter orders based on user's lab name
      const user = getUserFromStorage()
      if (user && user.labName) {
        const filteredOrders = filterOrdersByLab(data, user.labName)
        setOrders(filteredOrders)
      } else {
        setOrders(data)
        setError("Impossible de récupérer les informations de l'utilisateur")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const testApiConnection = async () => {
    try {
      const response = await fetch("http://localhost:5000/orders", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`API test failed with status: ${response.status}`)
      }

      console.log("API connection test successful!")
      return true
    } catch (err) {
      console.error("API connection test failed:", err)
      setError(`API connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      return false
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: ProductionOrder["status"]) => {
    try {
      setIsUpdating(true)
      setError(null)

      // Update local state optimistically
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)),
      )

      console.log(`Updating order ${orderId} to status: ${newStatus}`)

      // Make API call to update status
      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Add mode: 'cors' to explicitly request CORS
          Accept: "application/json",
        },
        mode: "cors", // Add this line to explicitly enable CORS
        credentials: "same-origin", // Adjust as needed: 'include', 'same-origin', or 'omit'
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`Server responded with status: ${response.status}, body: ${errorText}`)
        throw new Error(`Failed to update order status: ${response.status} ${errorText}`)
      }

      console.log(`Successfully updated order ${orderId} to ${newStatus}`)

      // Show success message
      setError(null)
    } catch (err) {
      console.error("Error updating order status:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour")

      // Revert optimistic update
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status:
                  order.status === newStatus ? (newStatus === "IN_PROGRESS" ? "PENDING" : "IN_PROGRESS") : order.status,
              }
            : order,
        ),
      )
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    // Get user data from localStorage
    const user = getUserFromStorage()
    setUserData(user)

    if (!user || !user.labName) {
      setError("Utilisateur non connecté ou données manquantes")
      setLoading(false)
      return
    }

    // Test API connection first
    testApiConnection().then((success) => {
      if (success) {
        fetchOrders()
      }
    })
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Chargement des commandes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Erreur</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchOrders} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suivi de Production</h1>
            <p className="text-muted-foreground">
              Gérez l'état d'avancement des commandes en laboratoire.
              {userData && <span className="font-medium"> - Laboratoire: {userData.labName}</span>}
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          <KanbanColumn
            title="À Produire"
            orders={orders}
            status="PENDING"
            onUpdateStatus={handleUpdateStatus}
            icon={CookingPot}
            isUpdating={isUpdating}
          />
          <KanbanColumn
            title="En Production"
            orders={orders}
            status="IN_PROGRESS"
            onUpdateStatus={handleUpdateStatus}
            icon={CookingPot}
            isUpdating={isUpdating}
          />
          <KanbanColumn
            title="Prêt pour Livraison"
            orders={orders}
            status="READY_FOR_DELIVERY"
            onUpdateStatus={handleUpdateStatus}
            icon={PackageCheck}
            isUpdating={isUpdating}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
