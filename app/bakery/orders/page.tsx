"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Eye, Filter, Minus, Plus, Search, ShoppingCart, Trash, Loader2, Calendar, Menu } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusBadge } from "./status-badge"
import { StatusActions } from "./status-actions"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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

  // Mobile tabs component
  const MobileTabs = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Filtrer par statut</h3>
          <div className="space-y-2">
            {[
              { value: "all", label: "Toutes les commandes" },
              { value: "pending", label: "En attente" },
              { value: "in_progress", label: "En préparation" },
              { value: "ready", label: "Prêt à livrer" },
              { value: "delivering", label: "En livraison" },
              { value: "delivered", label: "Livré" },
              { value: "cancelled", label: "Annulé" },
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Order card component for better mobile layout
  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <div className="font-medium text-sm sm:text-base">{order.orderReferenceId}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{order.bakeryName}</div>
              <div className="text-xs text-muted-foreground">{formatDate(order.createdAt || order.scheduledDate)}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-bold text-lg">
              {formatPrice(order.products.reduce((total, product) => total + product.totalPrice, 0))}
            </div>
            <div className="flex gap-2">
              <StatusActions
                status={order.status}
                orderId={order._id || order.orderId}
                onStatusChange={updateOrderStatus}
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewingOrder(order)
                  setIsViewDialogOpen(true)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Voir</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Commandes</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gérez vos commandes de produits</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Nouvelle commande</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle commande</DialogTitle>
                <DialogDescription>Ajoutez des produits à votre commande</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Form fields with better mobile layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

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
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse de livraison</Label>
                  <Input
                    id="address"
                    placeholder="Adresse complète de livraison"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Product selection with mobile-friendly layout */}
                <div className="grid gap-2">
                  <Label>Produits</Label>
                  <div className="flex flex-col gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Order products with mobile-optimized layout */}
                {orderProducts.length > 0 && (
                  <div className="space-y-3">
                    {orderProducts.map((item, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-sm">{item.productName}</div>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Prix unitaire: {formatPrice(item.pricePerUnit)}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Card className="p-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Total commande</div>
                        <div className="font-bold">{formatPrice(calculateTotalPrice())}</div>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Instructions spéciales pour la commande..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
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
                  className="w-full sm:w-auto"
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

        {/* Mobile and Desktop Tabs */}
        <div className="space-y-4">
          {/* Mobile filter button */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileTabs />
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Desktop tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="in_progress">En préparation</TabsTrigger>
              <TabsTrigger value="ready">Prêt</TabsTrigger>
              <TabsTrigger value="delivering">En livraison</TabsTrigger>
              <TabsTrigger value="delivered">Livré</TabsTrigger>
              <TabsTrigger value="cancelled">Annulé</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and filter */}
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
                      <SelectItem value="DELIVERING">En livraison</SelectItem>
                      <SelectItem value="DELIVERED">Livré</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-sm sm:text-lg">Chargement des commandes...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 border rounded-md text-red-500">
                  <p className="text-sm sm:text-base">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Réessayer
                  </Button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 border rounded-md text-sm sm:text-base">Aucune commande trouvée</div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order._id || order.orderId} order={order} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la commande</DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="grid gap-4 py-4">
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

                <div>
                  <h3 className="font-medium mb-3">Produits commandés</h3>
                  <div className="space-y-2">
                    {viewingOrder.products.map((product, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{product.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.quantity} × {formatPrice(product.pricePerUnit)}
                            </div>
                          </div>
                          <div className="font-medium">{formatPrice(product.totalPrice)}</div>
                        </div>
                      </Card>
                    ))}
                    <Card className="p-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Total commande</div>
                        <div className="font-bold text-lg">
                          {formatPrice(viewingOrder.products.reduce((total, product) => total + product.totalPrice, 0))}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Label htmlFor="status-update" className="text-sm font-medium mt-2 sm:mt-0 sm:mr-2">
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
              <Button onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
