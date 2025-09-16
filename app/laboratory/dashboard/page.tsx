"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, CheckCircle2, Clock, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
// import type { Order, OrderProduct } from ".http://localhost:5000/orders/route" // Import the Order type
interface OrderProduct {
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

interface Order {
  _id: string // Simulating MongoDB _id
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string // Using string for simplicity, can be Date
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
export default function LaboratoryDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userLabName, setUserLabName] = useState<string | null>(null)
  const [labData, setLabData] = useState<any>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:5000/orders")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setOrders(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLaboratoryInfo = async () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        console.error('No userInfo found in localStorage');
        return;
      }
      const { token } = JSON.parse(userInfo);

      const response = await fetch('http://localhost:5000/api/laboratory-info/my-lab', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch laboratory info');
      }
      
      const data = await response.json();
      console.log('Laboratory API Response:', data);
      
      // Handle both array and single object responses
      let laboratoryData;
      if (Array.isArray(data)) {
        const activeLab = data.find(lab => lab.isActive) || data[0];
        laboratoryData = activeLab;
      } else {
        laboratoryData = data;
      }
      
      if (laboratoryData) {
        setLabData(laboratoryData);
        setUserLabName(laboratoryData.labName);
        console.log('Set lab name to:', laboratoryData.labName);
      }
    } catch (error) {
      console.error('Error fetching laboratory info:', error);
      // Fallback to localStorage user data if API fails
      const userDataString = localStorage.getItem("user")
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString)
          if (userData && userData.labName) {
            setUserLabName(userData.labName)
          }
        } catch (e) {
          console.error("Failed to parse user data from local storage", e)
        }
      }
    }
  }

  useEffect(() => {
    // Fetch laboratory info first, then orders
    fetchLaboratoryInfo().then(() => {
      fetchOrders()
    })
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // Re-fetch orders to update the UI
      fetchOrders()
    } catch (e: any) {
      console.error("Failed to update order status:", e)
      setError("Failed to update order status: " + e.message)
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by labName first
    const matchesLab = userLabName ? order.products.some((product) => product.laboratory === userLabName) : true

    // Then apply search term filter
    const matchesSearchTerm =
      order.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some((product) => product.productName.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesLab && matchesSearchTerm
  })

  const pendingOrders = filteredOrders.filter((order) => order.status === "PENDING")
  const inProductionOrders = filteredOrders.filter((order) => order.status === "IN_PROGRESS")
  const readyForDeliveryOrders = filteredOrders.filter((order) => order.status === "READY_FOR_DELIVERY")

  if (loading) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex flex-col gap-4">
          <p>Loading orders...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex flex-col gap-4">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={fetchOrders}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{userLabName || "Laboratoire Central"}</h1>
            <p className="text-muted-foreground">
              Tableau de production du{" "}
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="w-full md:w-[200px] pl-8 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">À produire</CardTitle>
              <CardDescription>Commandes en attente de production</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">En production</CardTitle>
              <CardDescription>Commandes en cours de préparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{inProductionOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Terminées</CardTitle>
              <CardDescription>Commandes prêtes pour livraison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{readyForDeliveryOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mt-4">Tableau de production</h2>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commandes à produire</CardTitle>
                  <CardDescription>Commandes en attente de traitement</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">À produire</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            Livraison:{" "}
                            {new Date(order.scheduledDate).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{product.productName}</span>
                            <span className="font-medium">x{product.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => updateOrderStatus(order._id, "IN_PROGRESS")}>
                          Démarrer la production <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande à produire.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>En production</CardTitle>
                  <CardDescription>Commandes en cours de préparation</CardDescription>
                </div>
                <Badge variant="secondary">En cours</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {inProductionOrders.length > 0 ? (
                  inProductionOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Démarré il y a {Math.floor(Math.random() * 60)} min</span> {/* Mock time */}
                        </div>
                      </div>
                      <div className="space-y-3 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {product.productName} (x{product.quantity})
                              </span>
                              
                            </div>
                            
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => updateOrderStatus(order._id, "READY_FOR_DELIVERY")}>
                          Terminer <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande en production.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prêt pour livraison</CardTitle>
                  <CardDescription>Commandes terminées en attente de livraison</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Terminé
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {readyForDeliveryOrders.length > 0 ? (
                  readyForDeliveryOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Terminé il y a {Math.floor(Math.random() * 30)} min</span> {/* Mock time */}
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{product.productName}</span>
                            <span className="font-medium">x{product.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end"></div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande prête pour livraison.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
