"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Eye, Filter, Minus, Plus, Search, ShoppingCart, Trash, Loader2, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusBadge } from "./status-badge"
import { StatusActions } from "./status-actions"

// Define types
interface Product {
  id: string
  name: string
  unitPrice: number
}

interface OrderProduct {
  productName: string
  pricePerUnit: number
  quantity: number
  totalPrice: number
}

interface Order {
  _id?: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate: string | null
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DELIVERING" | "DELIVERED" | "CANCELLED"
  notes: string
  address: string
  products: OrderProduct[]
  createdAt?: string
  updatedAt?: string
}

// Sample products data - this could also come from an API
const availableProducts: Product[] = [
  { id: "1", name: "Baguette Tradition", unitPrice: 1.2 },
  { id: "2", name: "Pain au Chocolat", unitPrice: 1.5 },
  { id: "3", name: "Croissant", unitPrice: 1.3 },
  { id: "4", name: "Pain aux Céréales", unitPrice: 2.8 },
  { id: "5", name: "Éclair au Chocolat", unitPrice: 2.5 },
]

// Sample delivery users - this could also come from an API
const deliveryUsers = [
  { id: "1", name: "Jean Dupont" },
  { id: "2", name: "Marie Martin" },
  { id: "3", name: "Pierre Durand" },
]

// Sample bakeries - this could also come from an API
const bakeries = [
  { id: "1", name: "Boulangerie Centrale" },
  { id: "2", name: "Aux Délices du Pain" },
  { id: "3", name: "La Mie Dorée" },
]

export default function BakeryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // New order state
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([])
  const [orderNotes, setOrderNotes] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bakeryName, setBakeryName] = useState("")
  const [deliveryUserId, setDeliveryUserId] = useState("")
  const [deliveryUserName, setDeliveryUserName] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())
  const [address, setAddress] = useState("")

  // Fetch orders from the backend
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("http://localhost:5000/orders")

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }

        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error("Error fetching orders:", error)
        setError("Failed to load orders. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  // Update delivery user name when delivery user ID changes
  useEffect(() => {
    if (deliveryUserId) {
      const user = deliveryUsers.find((user) => user.id === deliveryUserId)
      if (user) {
        setDeliveryUserName(user.name)
      }
    } else {
      setDeliveryUserName("")
    }
  }, [deliveryUserId])

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryUserName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && order.status === "PENDING") ||
      (activeTab === "in_progress" && order.status === "IN_PROGRESS") ||
      (activeTab === "ready" && order.status === "READY_FOR_DELIVERY") ||
      (activeTab === "delivering" && order.status === "DELIVERING") ||
      (activeTab === "delivered" && order.status === "DELIVERED") ||
      (activeTab === "cancelled" && order.status === "CANCELLED")

    return matchesSearch && matchesStatus && matchesTab
  })

  // Add product to order
  const addProductToOrder = (productId: string) => {
    const product = availableProducts.find((p) => p.id === productId)
    if (!product) return

    const existingItemIndex = orderProducts.findIndex((item) => item.productName === product.name)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderProducts]
      updatedItems[existingItemIndex].quantity += 1
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].pricePerUnit
      setOrderProducts(updatedItems)
    } else {
      // Add new item
      setOrderProducts([
        ...orderProducts,
        {
          productName: product.name,
          pricePerUnit: product.unitPrice,
          quantity: 1,
          totalPrice: product.unitPrice,
        },
      ])
    }

    setSelectedProduct("")
  }

  // Update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedItems = [...orderProducts]
      updatedItems.splice(index, 1)
      setOrderProducts(updatedItems)
    } else {
      // Update quantity
      const updatedItems = [...orderProducts]
      updatedItems[index].quantity = newQuantity
      updatedItems[index].totalPrice = updatedItems[index].pricePerUnit * newQuantity
      setOrderProducts(updatedItems)
    }
  }

  // Remove item from order
  const removeItem = (index: number) => {
    const updatedItems = [...orderProducts]
    updatedItems.splice(index, 1)
    setOrderProducts(updatedItems)
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    return orderProducts.reduce((total, item) => total + item.totalPrice, 0)
  }

  // Generate a unique order ID
  const generateOrderId = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  // Generate a reference ID
  const generateReferenceId = () => {
    return `CMD-2025-${String(orders.length + 1).padStart(3, "0")}`
  }

  // Handle order creation
  const handleCreateOrder = async () => {
    if (orderProducts.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit à la commande",
        variant: "destructive",
      })
      return
    }

    if (!bakeryName) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une boulangerie",
        variant: "destructive",
      })
      return
    }

    if (!deliveryUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un livreur",
        variant: "destructive",
      })
      return
    }

    if (!scheduledDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date de livraison",
        variant: "destructive",
      })
      return
    }

    if (!address) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse de livraison",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const newOrder: Order = {
      orderId: generateOrderId(),
      orderReferenceId: generateReferenceId(),
      bakeryName,
      deliveryUserId,
      deliveryUserName,
      scheduledDate: scheduledDate.toISOString(),
      actualDeliveryDate: null,
      status: "PENDING",
      notes: orderNotes,
      address,
      products: orderProducts,
    }

    try {
      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      })

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`)
      }

      const createdOrder = await response.json()

      // Update the orders list with the new order
      setOrders([createdOrder, ...orders])

      // Reset form
      setOrderProducts([])
      setOrderNotes("")
      setBakeryName("")
      setDeliveryUserId("")
      setDeliveryUserName("")
      setScheduledDate(new Date())
      setAddress("")
      setIsCreateDialogOpen(false)

      toast({
        title: "Commande créée",
        description: `La commande ${createdOrder.orderReferenceId} a été créée avec succès`,
      })
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      setIsLoading(true)

      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.status}`)
      }

      const updatedOrder = await response.json()

      // Update the orders list with the updated order
      setOrders(
        orders.map((order) =>
          order._id === updatedOrder._id || order.orderId === updatedOrder.orderId ? updatedOrder : order,
        ),
      )

      // If we're viewing this order, update the viewing order as well
      if (viewingOrder && (viewingOrder._id === updatedOrder._id || viewingOrder.orderId === updatedOrder.orderId)) {
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
      setIsLoading(false)
    }
  }

  function getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case "PENDING":
        return "IN_PROGRESS"
      case "IN_PROGRESS":
        return "READY_FOR_DELIVERY"
      case "READY_FOR_DELIVERY":
        return "DELIVERING"
      case "DELIVERING":
        return "DELIVERED"
      default:
        return null
    }
  }

  function getNextStatusLabel(currentStatus: string): string {
    switch (currentStatus) {
      case "PENDING":
        return "Marquer en préparation"
      case "IN_PROGRESS":
        return "Marquer prêt à livrer"
      case "READY_FOR_DELIVERY":
        return "Marquer en livraison"
      case "DELIVERING":
        return "Marquer comme livré"
      default:
        return "Mettre à jour"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr })
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Get status badge
  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case "PENDING":
  //       return (
  //         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
  //           En attente
  //         </Badge>
  //       )
  //     case "IN_PROGRESS":
  //       return <Badge variant="secondary">En préparation</Badge>
  //     case "READY_FOR_DELIVERY":
  //       return (
  //         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
  //           Prêt à livrer
  //         </Badge>
  //       )
  //     case "DELIVERING":
  //       return (
  //         <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
  //           En livraison
  //         </Badge>
  //       )
  //     case "DELIVERED":
  //       return (
  //         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
  //           Livré
  //         </Badge>
  //       )
  //     case "CANCELLED":
  //       return (
  //         <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
  //           Annulé
  //         </Badge>
  //       )
  //     default:
  //       return <Badge variant="outline">{status}</Badge>
  //   }
  // }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
            <p className="text-muted-foreground">Gérez vos commandes de produits</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle commande
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle commande</DialogTitle>
                <DialogDescription>Ajoutez des produits à votre commande</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Bakery Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="bakery">Boulangerie</Label>
                  <Select value={bakeryName} onValueChange={setBakeryName}>
                    <SelectTrigger id="bakery">
                      <SelectValue placeholder="Sélectionnez une boulangerie" />
                    </SelectTrigger>
                    <SelectContent>
                      {bakeries.map((bakery) => (
                        <SelectItem key={bakery.id} value={bakery.name}>
                          {bakery.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery User Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="deliveryUser">Livreur</Label>
                  <Select value={deliveryUserId} onValueChange={setDeliveryUserId}>
                    <SelectTrigger id="deliveryUser">
                      <SelectValue placeholder="Sélectionnez un livreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduled Date */}
                <div className="grid gap-2">
                  <Label htmlFor="scheduledDate">Date de livraison prévue</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="scheduledDate"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionnez une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Delivery Address */}
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse de livraison</Label>
                  <Input
                    id="address"
                    placeholder="Adresse complète de livraison"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Product Selection */}
                <div className="grid gap-2">
                  <Label>Produits</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct} className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatPrice(product.unitPrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => addProductToOrder(selectedProduct)}
                      disabled={!selectedProduct}
                      className="mt-1 sm:mt-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Ajouter</span>
                    </Button>
                  </div>
                </div>

                {orderProducts.length > 0 && (
                  <div className="space-y-4">
                    {orderProducts.map((item, index) => (
                      <div key={index} className="border rounded-md p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{item.productName}</div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Prix unitaire: {formatPrice(item.pricePerUnit)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Diminuer</span>
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Augmenter</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Total:</div>
                          <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                      <div className="font-medium">Total commande</div>
                      <div className="font-bold">{formatPrice(calculateTotalPrice())}</div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Instructions spéciales pour la commande..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={
                    orderProducts.length === 0 ||
                    isSubmitting ||
                    !bakeryName ||
                    !deliveryUserId ||
                    !scheduledDate ||
                    !address
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Commander
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-4">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="in_progress">En préparation</TabsTrigger>
            <TabsTrigger value="ready">Prêt à livrer</TabsTrigger>
            <TabsTrigger value="delivering">En livraison</TabsTrigger>
            <TabsTrigger value="delivered">Livré</TabsTrigger>
            <TabsTrigger value="cancelled">Annulé</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>
                  {isLoading ? "Chargement des commandes..." : `${filteredOrders.length} commandes trouvées`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Rechercher une commande..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="IN_PROGRESS">En préparation</SelectItem>
                        <SelectItem value="READY_FOR_DELIVERY">Prêt à livrer</SelectItem>
                        <SelectItem value="DELIVERING">En livraison</SelectItem>
                        <SelectItem value="DELIVERED">Livré</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Chargement des commandes...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 border rounded-md text-red-500">
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      Réessayer
                    </Button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">Aucune commande trouvée</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredOrders.map((order) => (
                      <div key={order._id || order.orderId} className="border rounded-md p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{order.orderReferenceId}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.bakeryName} • {formatDate(order.createdAt || order.scheduledDate)}
                            </div>
                          </div>
                          <StatusActions
                            status={order.status}
                            orderId={order._id || order.orderId}
                            onStatusChange={updateOrderStatus}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-bold">
                            {formatPrice(order.products.reduce((total, product) => total + product.totalPrice, 0))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingOrder(order)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs will show the same content but filtered by status */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Commandes en attente</CardTitle>
                <CardDescription>
                  {isLoading ? "Chargement des commandes..." : `${filteredOrders.length} commandes trouvées`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Same content as above */}
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Chargement des commandes...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 border rounded-md text-red-500">
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      Réessayer
                    </Button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">Aucune commande trouvée</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredOrders.map((order) => (
                      <div key={order._id || order.orderId} className="border rounded-md p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{order.orderReferenceId}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.bakeryName} • {formatDate(order.createdAt || order.scheduledDate)}
                            </div>
                          </div>
                          <StatusActions
                            status={order.status}
                            orderId={order._id || order.orderId}
                            onStatusChange={updateOrderStatus}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-bold">
                            {formatPrice(order.products.reduce((total, product) => total + product.totalPrice, 0))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingOrder(order)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar content for other tabs */}
          <TabsContent value="in_progress" className="space-y-4">
            {/* Similar content as above */}
          </TabsContent>
          <TabsContent value="ready" className="space-y-4">
            {/* Similar content as above */}
          </TabsContent>
          <TabsContent value="delivering" className="space-y-4">
            {/* Similar content as above */}
          </TabsContent>
          <TabsContent value="delivered" className="space-y-4">
            {/* Similar content as above */}
          </TabsContent>
          <TabsContent value="cancelled" className="space-y-4">
            {/* Similar content as above */}
          </TabsContent>
        </Tabs>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la commande</DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Informations générales</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Référence:</span>
                        <span>{viewingOrder.orderReferenceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Boulangerie:</span>
                        <span>{viewingOrder.bakeryName}</span>
                      </div>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut:</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={viewingOrder.status} />
                          {viewingOrder.status !== "DELIVERED" && viewingOrder.status !== "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextStatus = getNextStatus(viewingOrder.status)
                                if (nextStatus) {
                                  updateOrderStatus(viewingOrder._id || viewingOrder.orderId, nextStatus)
                                }
                              }}
                              disabled={isLoading}
                            >
                              {getNextStatusLabel(viewingOrder.status)}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Adresse de livraison</h3>
                    <p className="mt-2 text-sm">{viewingOrder.address}</p>

                    <h3 className="font-medium mt-4">Notes</h3>
                    <p className="mt-2 text-sm">{viewingOrder.notes || "Aucune note"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Produits commandés</h3>
                  <div className="space-y-3">
                    {viewingOrder.products.map((product, index) => (
                      <div key={index} className="border rounded-md p-3 space-y-2">
                        <div className="font-medium">{product.productName}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {product.quantity} × {formatPrice(product.pricePerUnit)}
                          </div>
                          <div className="font-medium">{formatPrice(product.totalPrice)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                      <div className="font-medium">Total commande</div>
                      <div className="font-bold">
                        {formatPrice(viewingOrder.products.reduce((total, product) => total + product.totalPrice, 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center">
              <div className="flex-1 flex flex-col sm:flex-row gap-2 items-start">
                <Label htmlFor="status-update" className="mt-2 sm:mt-0">
                  Mettre à jour le statut:
                </Label>
                <Select
                  onValueChange={(value) =>
                    viewingOrder && updateOrderStatus(viewingOrder._id || viewingOrder.orderId, value)
                  }
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
                    <SelectItem value="DELIVERING">En livraison</SelectItem>
                    <SelectItem value="DELIVERED">Livré</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
