"use client"

import { useState } from "react"
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
import { Eye, Filter, Minus, Plus, Search, ShoppingCart, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define types
interface Product {
  id: string
  name: string
  unitPrice: number
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

interface Order {
  id: string
  referenceId: string
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DELIVERING" | "DELIVERED" | "CANCELLED"
  items: OrderItem[]
  totalPrice: number
  notes: string
  createdAt: string
}

// Sample data
const availableProducts: Product[] = [
  { id: "1", name: "Baguette Tradition", unitPrice: 1.2 },
  { id: "2", name: "Pain au Chocolat", unitPrice: 1.5 },
  { id: "3", name: "Croissant", unitPrice: 1.3 },
  { id: "4", name: "Pain aux Céréales", unitPrice: 2.8 },
  { id: "5", name: "Éclair au Chocolat", unitPrice: 2.5 },
]

const initialOrders: Order[] = [
  {
    id: "1",
    referenceId: "CMD-2025-001",
    status: "PENDING",
    items: [
      { productId: "1", productName: "Baguette Tradition", quantity: 50, unitPrice: 1.2 },
      { productId: "2", productName: "Pain au Chocolat", quantity: 30, unitPrice: 1.5 },
    ],
    totalPrice: 105,
    notes: "Livraison avant 7h du matin",
    createdAt: "2025-04-22T06:30:00Z",
  },
  {
    id: "2",
    referenceId: "CMD-2025-002",
    status: "IN_PROGRESS",
    items: [
      { productId: "1", productName: "Baguette Tradition", quantity: 40, unitPrice: 1.2 },
      { productId: "3", productName: "Croissant", quantity: 25, unitPrice: 1.3 },
      { productId: "4", productName: "Pain aux Céréales", quantity: 15, unitPrice: 2.8 },
    ],
    totalPrice: 115.5,
    notes: "",
    createdAt: "2025-04-22T07:15:00Z",
  },
  {
    id: "3",
    referenceId: "CMD-2025-003",
    status: "READY_FOR_DELIVERY",
    items: [
      { productId: "1", productName: "Baguette Tradition", quantity: 30, unitPrice: 1.2 },
      { productId: "2", productName: "Pain au Chocolat", quantity: 20, unitPrice: 1.5 },
      { productId: "3", productName: "Croissant", quantity: 20, unitPrice: 1.3 },
    ],
    totalPrice: 92,
    notes: "Commande urgente",
    createdAt: "2025-04-22T08:00:00Z",
  },
  {
    id: "4",
    referenceId: "CMD-2025-004",
    status: "DELIVERING",
    items: [
      { productId: "1", productName: "Baguette Tradition", quantity: 25, unitPrice: 1.2 },
      { productId: "4", productName: "Pain aux Céréales", quantity: 10, unitPrice: 2.8 },
    ],
    totalPrice: 58,
    notes: "",
    createdAt: "2025-04-21T16:45:00Z",
  },
  {
    id: "5",
    referenceId: "CMD-2025-005",
    status: "DELIVERED",
    items: [
      { productId: "1", productName: "Baguette Tradition", quantity: 45, unitPrice: 1.2 },
      { productId: "2", productName: "Pain au Chocolat", quantity: 35, unitPrice: 1.5 },
      { productId: "3", productName: "Croissant", quantity: 30, unitPrice: 1.3 },
    ],
    totalPrice: 142.5,
    notes: "",
    createdAt: "2025-04-21T07:30:00Z",
  },
]

export default function BakeryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // New order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.referenceId.toLowerCase().includes(searchTerm.toLowerCase())

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

    const existingItemIndex = orderItems.findIndex((item) => item.productId === productId)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      setOrderItems(updatedItems)
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
        },
      ])
    }

    setSelectedProduct("")
  }

  // Update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedItems = [...orderItems]
      updatedItems.splice(index, 1)
      setOrderItems(updatedItems)
    } else {
      // Update quantity
      const updatedItems = [...orderItems]
      updatedItems[index].quantity = newQuantity
      setOrderItems(updatedItems)
    }
  }

  // Remove item from order
  const removeItem = (index: number) => {
    const updatedItems = [...orderItems]
    updatedItems.splice(index, 1)
    setOrderItems(updatedItems)
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    return orderItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  }

  // Handle order creation
  const handleCreateOrder = () => {
    if (orderItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit à la commande",
        variant: "destructive",
      })
      return
    }

    const newOrder: Order = {
      id: `${orders.length + 1}`,
      referenceId: `CMD-2025-${String(orders.length + 1).padStart(3, "0")}`,
      status: "PENDING",
      items: orderItems,
      totalPrice: calculateTotalPrice(),
      notes: orderNotes,
      createdAt: new Date().toISOString(),
    }

    setOrders([newOrder, ...orders])
    setOrderItems([])
    setOrderNotes("")
    setIsCreateDialogOpen(false)
    toast({
      title: "Commande créée",
      description: `La commande ${newOrder.referenceId} a été créée avec succès`,
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            En attente
          </Badge>
        )
      case "IN_PROGRESS":
        return <Badge variant="secondary">En préparation</Badge>
      case "READY_FOR_DELIVERY":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Prêt à livrer
          </Badge>
        )
      case "DELIVERING":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            En livraison
          </Badge>
        )
      case "DELIVERED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Livré
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Annulé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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

                {orderItems.length > 0 && (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
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
                            Prix unitaire: {formatPrice(item.unitPrice)}
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
                          <div className="font-medium">{formatPrice(item.quantity * item.unitPrice)}</div>
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
                <Button onClick={handleCreateOrder} disabled={orderItems.length === 0}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Commander
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          {/* <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 mb-4 w-full gap-1">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="in_progress">En cours</TabsTrigger>
            <TabsTrigger value="ready">Prêt</TabsTrigger>
            <TabsTrigger value="delivering">Livraison</TabsTrigger>
            <TabsTrigger value="delivered">Livrées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
          </TabsList> */}

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
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
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">Aucune commande trouvée</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredOrders.map((order) => (
                        <div key={order.id} className="border rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{order.referenceId}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="font-bold">{formatPrice(order.totalPrice)}</div>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs will show the same content but filtered by status */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Commandes en attente</CardTitle>
                <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Same table content as above */}
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">Aucune commande trouvée</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredOrders.map((order) => (
                        <div key={order.id} className="border rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{order.referenceId}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="font-bold">{formatPrice(order.totalPrice)}</div>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar content for other tabs */}
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
                        <span>{viewingOrder.referenceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{formatDate(viewingOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut:</span>
                        <span>{getStatusBadge(viewingOrder.status)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Notes</h3>
                    <p className="mt-2 text-sm">{viewingOrder.notes || "Aucune note"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Produits commandés</h3>
                  <div className="space-y-3">
                    {viewingOrder.items.map((item, index) => (
                      <div key={index} className="border rounded-md p-3 space-y-2">
                        <div className="font-medium">{item.productName}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × {formatPrice(item.unitPrice)}
                          </div>
                          <div className="font-medium">{formatPrice(item.quantity * item.unitPrice)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                      <div className="font-medium">Total commande</div>
                      <div className="font-bold">{formatPrice(viewingOrder.totalPrice)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
