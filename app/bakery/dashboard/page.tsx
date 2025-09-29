"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, ClipboardCheck, ClipboardList, Clock, Plus, ShoppingBag, RefreshCw, Search, Filter, Eye, Loader2 } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { format, isToday, isFuture, differenceInMinutes, differenceInHours } from "date-fns"
import { fr } from "date-fns/locale" // Import French locale for date-fns
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator" // Added Separator for design
import { ScrollArea } from "@/components/ui/scroll-area" // Added ScrollArea for details dialog
import { useToast } from "@/hooks/use-toast" // Import useToast
import { useRouter } from "next/navigation" // Import useRouter
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Order } from "@/types/order" // Corrected import path

export default function BakeryDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  // Table functionality state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast() // Initialize useToast
  const router = useRouter() // Initialize useRouter

  // Function to fetch orders from the Next.js API route
  const fetchOrdersData = useCallback(async () => {
    try {
      const response = await fetch(`/orders`, {
        cache: "no-store", // Ensure fresh data on each request
      })

      if (!response.ok) {
        console.error("Failed to fetch orders from API route:", response.status, response.statusText)
        try {
          const errorBody = await response.json()
          console.error("Error details:", errorBody)
        } catch (e) {
          console.error("Could not parse error body.")
        }
        setError("Failed to load orders. Please check your backend server.")
        setOrders([])
        return
      }

      const orders: Order[] = await response.json()
      setOrders(orders)
      setError(null) // Clear any previous errors
    } catch (err) {
      setError("Failed to load orders. Please check your backend server.")
      console.error("Error fetching orders:", err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrdersData()
  }, [fetchOrdersData])

  // Filter orders based on status and date
  const todayOrders = useMemo(() => orders.filter((order) => isToday(new Date(order.scheduledDate))), [orders])
  const pendingOrders = useMemo(() => todayOrders.filter((order) => order.status === "PENDING"), [todayOrders])
  const processingOrders = useMemo(() => todayOrders.filter((order) => order.status === "IN_PROGRESS"), [todayOrders])
  const completedOrders = useMemo(() => todayOrders.filter((order) => order.status === "DELIVERED"), [todayOrders])

  // Calculate next delivery
  const nextDelivery = useMemo(() => {
    const now = new Date()
    return orders
      .filter((order) => isFuture(new Date(order.scheduledDate)) && order.status !== "DELIVERED")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }, [orders])

  // Utility functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr })
  }

  // Standard French VAT rate for bakery products
  const TAX_RATE = 0.06 // 6%

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Helper function to calculate HT price from TTC price
  const calculateHTPriceFromTTC = (ttcPrice: number): number => {
    return ttcPrice / (1 + TAX_RATE)
  }

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "PENDING":
          return { label: "En attente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
        case "IN_PROGRESS":
          return { label: "En préparation", className: "bg-blue-100 text-blue-800 border-blue-200" }
        case "READY_FOR_DELIVERY":
          return { label: "Prêt à livrer", className: "bg-purple-100 text-purple-800 border-purple-200" }
        case "DISPATCHED":
          return { label: "Dispatché", className: "bg-orange-100 text-orange-800 border-orange-200" }
        case "DELIVERING":
          return { label: "En livraison", className: "bg-indigo-100 text-indigo-800 border-indigo-200" }
        case "DELIVERED":
          return { label: "Livré", className: "bg-green-100 text-green-800 border-green-200" }
        case "CANCELLED":
          return { label: "Annulé", className: "bg-red-100 text-red-800 border-red-200" }
        default:
          return { label: status, className: "bg-gray-100 text-gray-800 border-gray-200" }
      }
    }

    const config = getStatusConfig(status)
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Order filtering (copied from orders page)
  const filteredOrders = orders.filter((order) => {
    // Provide default empty strings if properties are null or undefined
    const orderRefId = order.orderReferenceId || ""
    const bakeryNameLower = order.bakeryName?.toLowerCase() || ""
    const deliveryUserNameLower = order.deliveryUserName?.toLowerCase() || ""

    const matchesSearch =
      orderRefId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bakeryNameLower.includes(searchTerm.toLowerCase()) ||
      (order.deliveryUserName &&
        order.deliveryUserName !== "À assigner" &&
        deliveryUserNameLower.includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && order.status === "PENDING") ||
      (activeTab === "in_progress" && order.status === "IN_PROGRESS") ||
      (activeTab === "ready" && order.status === "READY_FOR_DELIVERY") ||
      (activeTab === "dispatched" && order.status === "DISPATCHED") ||
      (activeTab === "delivering" && order.status === "DELIVERING") ||
      (activeTab === "delivered" && order.status === "DELIVERED") ||
      (activeTab === "cancelled" && order.status === "CANCELLED")

    return matchesSearch && matchesStatus && matchesTab
  })

  // OrderCard Component (copied from orders page)
  const OrderCard = ({ order }: { order: Order }) => {
    // FIX: Ensure order.products is an array before calling reduce
    const products = order.products || []
    const totalPrice = products.reduce((total, product) => total + product.totalPrice, 0)
    const totalQuantity = products.reduce((total, product) => total + product.quantity, 0)

    return (
      <Card className="border-2 hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {order.orderReferenceId} - {order.bakeryName}
          </CardTitle>
          <StatusBadge status={order.status} />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Date prévue:</span>
              <span className="font-medium">{formatDate(order.scheduledDate)}</span>
            </div>
            {order.laboratory && (
              <div className="flex justify-between">
                <span>Laboratoire:</span>
                <span className="font-medium">{order.laboratory}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Livreur:</span>
              <span className="font-medium">{order.deliveryUserName}</span>
            </div>
            <div className="flex justify-between">
              <span>Produits:</span>
              <span className="font-medium">
                {products.length} articles ({totalQuantity} unités)
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total HT:</span>
                <span>{formatPrice(calculateHTPriceFromTTC(totalPrice))}</span>
              </div>
              <div className="flex justify-between font-bold text-primary">
                <span>Total TTC:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewingOrder(order)
                setIsViewDialogOpen(true)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mobile Tabs Component (copied from orders page)
  const MobileTabs = () => {
    return (
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="in_progress">En préparation</SelectItem>
          <SelectItem value="ready">Prêt</SelectItem>
          <SelectItem value="dispatched">Dispatché</SelectItem>
          <SelectItem value="delivering">En livraison</SelectItem>
          <SelectItem value="delivered">Livré</SelectItem>
          <SelectItem value="cancelled">Annulé</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.status}`)
      }

      const updatedOrder = (await response.json()) as Order // Cast to Order
      setOrders(
        orders.map(
          (order) => (order._id === updatedOrder._id ? updatedOrder : order), // Use _id directly for comparison
        ),
      )

      if (viewingOrder && viewingOrder._id === updatedOrder._id) {
        setViewingOrder(updatedOrder)
      }

      toast({
        title: "Statut mis à jour",
        description: `Le statut de la commande a été mis à jour avec succès`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "IN_PROGRESS")
  }

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "DELIVERED")
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex flex-col gap-4 p-4">
          <div className="text-center text-muted-foreground">Chargement des données du tableau de bord...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex flex-col gap-4 p-4">
          <div className="text-center text-red-500">{error}</div>
          <div className="text-center text-muted-foreground text-sm">
            Please ensure your backend API is running at `/orders` and accessible.
            <br />
            For the v0 preview, this API endpoint is not accessible. You will see data when running locally with your
            backend.
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boulangerie Saint-Michel</h1>
            <p className="text-muted-foreground">Bienvenue sur votre tableau de bord boulangerie.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button 
              onClick={() => router.push('/bakery/orders')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button> */}
            <Button onClick={fetchOrdersData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes du jour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingOrders.length} en attente, {processingOrders.length} en préparation, {completedOrders.length}{" "}
                terminées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits populaires</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* This data would require aggregation on the backend or client-side */}
              <div className="text-2xl font-bold">Baguette Tradition</div>
              <p className="text-xs text-muted-foreground">Vendu 128 fois cette semaine</p>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine livraison</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextDelivery ? (
                <>
                  <div className="text-2xl font-bold">
                    {format(new Date(nextDelivery.scheduledDate), "HH:mm", { locale: fr })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dans{" "}
                    {differenceInHours(new Date(nextDelivery.scheduledDate), new Date()) > 0
                      ? `${differenceInHours(new Date(nextDelivery.scheduledDate), new Date())} heures et `
                      : ""}
                    {differenceInMinutes(new Date(nextDelivery.scheduledDate), new Date()) % 60} minutes
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">Aucune</div>
              )}
            </CardContent>
          </Card> */}
        </div>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="processing">En préparation</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en attente</CardTitle>
                <CardDescription>Vous avez {pendingOrders.length} commandes en attente de traitement.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande en attente.</div>
                  ) : (
                    pendingOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge>En attente</Badge>
                          </div>
                          <CardDescription>
                            Reçue il y a {differenceInMinutes(new Date(), new Date(order.createdAt))} minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ul className="space-y-1 text-sm">
                            {order.products.map((product, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{product.productName}</span>
                                <span>x{product.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                         
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en préparation</CardTitle>
                <CardDescription>
                  Vous avez {processingOrders.length} commandes en cours de préparation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processingOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande en préparation.</div>
                  ) : (
                    processingOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge variant="secondary">En préparation</Badge>
                          </div>
                          <CardDescription>
                            En préparation depuis {differenceInMinutes(new Date(), new Date(order.createdAt))} minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="space-y-2">
                            {/* Placeholder for progress, you might need actual progress data */}
                            <div className="flex justify-between text-sm">
                              <span>Progression</span>
                              <span>75%</span> {/* This is still hardcoded */}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                          <Button size="sm" onClick={() => handleCompleteOrder(order._id)}>
                            Terminer <ClipboardCheck className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes terminées</CardTitle>
                <CardDescription>Vous avez terminé {completedOrders.length} commandes aujourd'hui.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande terminée.</div>
                  ) : (
                    completedOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Terminée
                            </Badge>
                          </div>
                          <CardDescription>
                            Terminée il y a{" "}
                            {differenceInMinutes(new Date(), new Date(order.actualDeliveryDate || order.updatedAt))}{" "}
                            minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ul className="space-y-1 text-sm">
                            {order.products.map((product, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{product.productName}</span>
                                <span>x{product.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                      
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Orders Table Section - Cloned from orders page */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Toutes les commandes</h2>
              <p className="text-muted-foreground">Gérez toutes vos commandes de produits</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 md:hidden">
              <MobileTabs />
              <div className="text-sm text-muted-foreground">
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="in_progress">En préparation</TabsTrigger>
                <TabsTrigger value="ready">Prêt</TabsTrigger>
                <TabsTrigger value="dispatched">Dispatché</TabsTrigger>
                <TabsTrigger value="delivering">En livraison</TabsTrigger>
                <TabsTrigger value="delivered">Livré</TabsTrigger>
                <TabsTrigger value="cancelled">Annulé</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une commande..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="IN_PROGRESS">En préparation</SelectItem>
                        <SelectItem value="READY_FOR_DELIVERY">Prêt à livrer</SelectItem>
                        <SelectItem value="DISPATCHED">Dispatché</SelectItem>
                        <SelectItem value="DELIVERING">En livraison</SelectItem>
                        <SelectItem value="DELIVERED">Livré</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-sm sm:text-lg">Chargement des commandes...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 border rounded-md text-red-500">
                    <p className="text-sm sm:text-base">{error}</p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => window.location.reload()}>
                      Réessayer
                    </Button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 border rounded-md text-sm sm:text-base">Aucune commande trouvée</div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Orders Detail Dialog - Cloned from orders page */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Informations générales</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Référence:</span>
                          <span className="font-medium">{viewingOrder.orderReferenceId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Boulangerie:</span>
                          <span>{viewingOrder.bakeryName}</span>
                        </div>
                        {viewingOrder.laboratory && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Laboratoire:</span>
                            <span>{viewingOrder.laboratory}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Livreur:</span>
                          <span>{viewingOrder.deliveryUserName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date prévue:</span>
                          <span>{formatDate(viewingOrder.scheduledDate)}</span>
                        </div>
                        {viewingOrder.actualDeliveryDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date de livraison:</span>
                            <span>{formatDate(viewingOrder.actualDeliveryDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Statut:</span>
                          <StatusBadge status={viewingOrder.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Adresse de livraison</h3>
                      <p className="text-sm bg-muted p-3 rounded-md">{viewingOrder.address}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Notes</h3>
                      <p className="text-sm bg-muted p-3 rounded-md">{viewingOrder.notes || "Aucune note"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Produits commandés</h3>
                  <div className="space-y-3">
                    {(viewingOrder.products || []).map((product, index) => (
                      <div
                        key={product.productRef || `${product.productName}-${product.laboratory}-${index}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPrice(product.unitPriceTTC)} × {product.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{formatPrice(product.totalPrice)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatPrice(calculateHTPriceFromTTC(product.totalPrice))} HT
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Sous-total HT:</span>
                      <span>
                        {formatPrice(
                          calculateHTPriceFromTTC(
                            (viewingOrder.products || []).reduce((total, product) => total + product.totalPrice, 0)
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>TVA (06%):</span>
                      <span>
                        {formatPrice(
                          (viewingOrder.products || []).reduce((total, product) => total + product.totalPrice, 0) -
                          calculateHTPriceFromTTC(
                            (viewingOrder.products || []).reduce((total, product) => total + product.totalPrice, 0)
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total TTC:</span>
                      <span className="text-primary">
                        {formatPrice(
                          (viewingOrder.products || []).reduce((total, product) => total + product.totalPrice, 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          {/* <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Label htmlFor="status-update" className="text-sm font-medium mt-2 sm:mt-0 sm:mr-2">
                Mettre à jour le statut:
              </Label>
              <Select
                onValueChange={(value) => viewingOrder && updateOrderStatus(viewingOrder._id, value)}
                defaultValue={viewingOrder?.status || ""}
                disabled={!viewingOrder}
              >
                <SelectTrigger id="status-update" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En préparation</SelectItem>
                  <SelectItem value="READY_FOR_DELIVERY">Prêt à livrer</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatché</SelectItem>
                  <SelectItem value="DELIVERING">En livraison</SelectItem>
                  <SelectItem value="DELIVERED">Livré</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
