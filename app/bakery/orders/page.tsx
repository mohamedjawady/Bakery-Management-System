"use client"

import { CardTitle } from "@/components/ui/card"
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
import {
  Eye,
  Filter,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash,
  Loader2,
  Calendar,
  AlertCircle,
  Info,
  Building2,
  Package,
  ArrowLeft,
  CheckCircle,
  X,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusBadge } from "./status-badge"
import { getProducts } from "@/lib/api/products"
import type { Product } from "@/types/product"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Keep all your existing interfaces exactly as they are
interface OrderProduct {
  productName: string
  pricePerUnit: number
  quantity: number
  totalPrice: number
  boulangerie?: string
}

interface Order {
  _id?: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  laboratory?: string
  deliveryUserId?: string
  deliveryUserName?: string
  assignedDeliveryUserId?: string
  assignedDeliveryUserName?: string
  scheduledDate: string
  actualDeliveryDate: string | null
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DISPATCHED" | "DELIVERING" | "DELIVERED" | "CANCELLED"
  notes: string
  address: string
  products: OrderProduct[]
  createdAt?: string
  updatedAt?: string
  isDispatched?: boolean
}

interface Bakery {
  _id: string
  bakeryname: string
  bakeryLocation: string
}

export default function BakeryOrdersPage() {
  // Keep all your existing state exactly as it is
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bakeries, setBakeries] = useState<Bakery[]>([])
  const [deliveryUsersFromAPI, setDeliveryUsersFromAPI] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingBakeries, setIsLoadingBakeries] = useState(true)
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

  // Laboratory selection state
  const [currentStep, setCurrentStep] = useState<"laboratory" | "products" | "details">("laboratory")
  const [laboratories, setLaboratories] = useState<any[]>([])
  const [selectedLaboratory, setSelectedLaboratory] = useState<any | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoadingLabs, setIsLoadingLabs] = useState(false)

  // Keep all your existing hardcoded fallback data
  const fallbackDeliveryUsers = [
    { id: "1", name: "Jean Dupont" },
    { id: "2", name: "Marie Martin" },
    { id: "3", name: "Pierre Durand" },
  ]

  // Keep all your existing fetch functions exactly as they are
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await getProducts({
        active: true,
        available: true,
        sortBy: "name",
        sortOrder: "asc",
      })
      if (response.success) {
        setProducts(response.data)
      } else {
        throw new Error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits. Certaines fonctionnalités peuvent être limitées.",
        variant: "destructive",
      })
      // Fallback data with laboratory field
      setProducts([
        {
          _id: "1",
          name: "Croissant",
          description: "Pâte feuilletée pur beurre",
          unitPrice: 1.2,
          category: "Viennoiserie",
          preparationTime: 20,
          laboratory: "Laboratoire Central Paris",
        },
        {
          _id: "2",
          name: "Pain au chocolat",
          description: "Pâte feuilletée au chocolat",
          unitPrice: 1.5,
          category: "Viennoiserie",
          preparationTime: 25,
          laboratory: "Laboratoire Central Paris",
        },
        {
          _id: "3",
          name: "Baguette",
          description: "Pain traditionnel français",
          unitPrice: 0.9,
          category: "Pain",
          preparationTime: 30,
          laboratory: "Laboratoire Lyon Sud",
        },
      ])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchBakeries = async () => {
    try {
      setIsLoadingBakeries(true)
      console.log("Bakery API not available - using manual input mode")
      setBakeries([])
    } catch (error) {
      console.error("Error in fetchBakeries:", error)
      setBakeries([])
    } finally {
      setIsLoadingBakeries(false)
    }
  }

  useEffect(() => {
    // Get bakery name from localStorage when component mounts
    const userData = localStorage.getItem("userInfo") || localStorage.getItem("userData")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.bakeryName) {
          setBakeryName(user.bakeryName)
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error)
      }
    }
  }, [])

  const fetchDeliveryUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      const users = await response.json()
      const activeDeliveryUsers = users.filter((user: any) => user.role === "delivery" && user.isActive)
      setDeliveryUsersFromAPI(activeDeliveryUsers)
    } catch (error) {
      console.error("Error fetching delivery users:", error)
      toast({
        title: "Avertissement",
        description: "Impossible de charger les livreurs depuis l'API. Utilisation de données de test.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchLaboratories = async () => {
    try {
      setIsLoadingLabs(true)
      const response = await fetch("/api/laboratory-info")
      if (!response.ok) {
        throw new Error("Failed to fetch laboratories")
      }
      const data = await response.json()
      const activeLabs = data.filter((lab: any) => lab.isActive)
      setLaboratories(activeLabs)
    } catch (error) {
      console.error("Error fetching laboratories:", error)
      // Fallback data for demo
      setLaboratories([
        {
          _id: "1",
          labName: "Laboratoire Central Paris",
          headChef: "Chef Martin",
          address: "123 Rue de la Boulangerie, Paris",
          isActive: true,
        },
        {
          _id: "2",
          labName: "Laboratoire Lyon Sud",
          headChef: "Chef Dubois",
          address: "456 Avenue des Pains, Lyon",
          isActive: true,
        },
        {
          _id: "3",
          labName: "Laboratoire Marseille",
          headChef: "Chef Moreau",
          address: "789 Boulevard des Croissants, Marseille",
          isActive: true,
        },
      ])
    } finally {
      setIsLoadingLabs(false)
    }
  }

  // Keep your existing useEffect for fetching orders
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

    const fetchAllData = async () => {
      await Promise.all([fetchOrders(), fetchDeliveryUsers(), fetchProducts(), fetchBakeries(), fetchLaboratories()])
    }

    fetchAllData()
  }, [toast])

  // Laboratory filtering effect
  useEffect(() => {
    if (selectedLaboratory && products.length > 0) {
      const filtered = products.filter((product) => product.laboratory === selectedLaboratory.labName)
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [selectedLaboratory, products])

  // Keep all your existing useEffects and functions exactly as they are
  useEffect(() => {
    if (deliveryUserId) {
      const allUsers = [...deliveryUsersFromAPI, ...fallbackDeliveryUsers]
      const user = allUsers.find((user) => user._id === deliveryUserId || user.id === deliveryUserId)
      if (user) {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name
        setDeliveryUserName(userName)
      }
    } else {
      setDeliveryUserName("")
    }
  }, [deliveryUserId, deliveryUsersFromAPI])

  // Keep all your existing filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.deliveryUserName &&
        order.deliveryUserName !== "À assigner" &&
        order.deliveryUserName.toLowerCase().includes(searchTerm.toLowerCase()))

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

  // Laboratory selection functions
  const handleLaboratorySelect = (laboratory: any) => {
    setSelectedLaboratory(laboratory)
    setCurrentStep("products")
  }

  const resetOrderForm = () => {
    setCurrentStep("laboratory")
    setSelectedLaboratory(null)
    setOrderProducts([])
    setOrderNotes("")
    setBakeryName("")
    setScheduledDate(new Date())
    setAddress("")
    setFilteredProducts([])
  }

  // Modified addProductToOrder function
  const addProductToOrder = (productId: string) => {
    const product = filteredProducts.find((p) => p._id === productId)
    if (!product) return

    const existingItemIndex = orderProducts.findIndex((item) => item.productName === product.name)

    if (existingItemIndex >= 0) {
      const currentQuantity = orderProducts[existingItemIndex].quantity
      if (currentQuantity >= 999) {
        toast({
          title: "Limite atteinte",
          description: "Quantité maximum atteinte pour ce produit (999)",
          variant: "destructive",
        })
        return
      }
      updateItemQuantity(existingItemIndex, currentQuantity + 1)
    } else {
      setOrderProducts([
        ...orderProducts,
        {
          productName: product.name,
          pricePerUnit: product.unitPrice,
          quantity: 1,
          totalPrice: product.unitPrice,
          laboratory: product.laboratory,
        },
      ])

      toast({
        title: "Produit ajouté",
        description: `${product.name} ajouté au panier`,
      })
    }
    setSelectedProduct("")
  }

  // Keep all your existing functions
  const updateItemQuantity = (index: number, newQuantity: number) => {
    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, Math.min(999, newQuantity))

    if (validQuantity <= 0) {
      const updatedItems = [...orderProducts]
      updatedItems.splice(index, 1)
      setOrderProducts(updatedItems)

      toast({
        title: "Produit retiré",
        description: "Le produit a été retiré de votre panier",
      })
    } else {
      const updatedItems = [...orderProducts]
      const oldQuantity = updatedItems[index].quantity
      updatedItems[index].quantity = validQuantity
      updatedItems[index].totalPrice = updatedItems[index].pricePerUnit * validQuantity
      setOrderProducts(updatedItems)

      // Show feedback for significant quantity changes
      if (Math.abs(validQuantity - oldQuantity) >= 10) {
        toast({
          title: "Quantité mise à jour",
          description: `${updatedItems[index].productName}: ${validQuantity} articles`,
        })
      }
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = [...orderProducts]
    updatedItems.splice(index, 1)
    setOrderProducts(updatedItems)
  }

  const calculateTotalPrice = () => {
    return orderProducts.reduce((total, item) => total + item.totalPrice, 0)
  }

  const generateOrderId = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  const generateReferenceId = () => {
    return `CMD-2025-${String(orders.length + 1).padStart(3, "0")}`
  }

  // Modified handleCreateOrder function
  const handleCreateOrder = async () => {
    if (orderProducts.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit à la commande",
        variant: "destructive",
      })
      return
    }

    if (!selectedLaboratory) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un laboratoire",
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
      laboratory: selectedLaboratory.labName,
      deliveryUserId: "DISPATCH_PENDING",
      deliveryUserName: "À assigner",
      scheduledDate: scheduledDate.toISOString(),
      actualDeliveryDate: scheduledDate.toISOString(),
      status: "PENDING",
      notes: orderNotes,
      address,
      products: orderProducts,
      isDispatched: true,
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
      setOrders([createdOrder, ...orders])
      resetOrderForm()
      setIsCreateDialogOpen(false)

      toast({
        title: "Commande créée",
        description: `La commande ${createdOrder.orderReferenceId} a été créée avec succès pour le laboratoire ${selectedLaboratory.labName}`,
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

  // Keep all your existing functions
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
      setOrders(
        orders.map((order) =>
          order._id === updatedOrder._id || order.orderId === updatedOrder.orderId ? updatedOrder : order,
        ),
      )

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  const selectAllProducts = () => {
    filteredProducts.forEach((product) => {
      const existingItem = orderProducts.find((item) => item.productName === product.name)
      if (!existingItem) {
        addProductToOrder(product._id)
      }
    })
  }

  const deselectAllProducts = () => {
    setOrderProducts([])
  }

  // ENHANCED Mobile-friendly step rendering functions
  const renderLaboratoryStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Sélectionnez un laboratoire</h3>
      </div>

      {isLoadingLabs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">Chargement des laboratoires...</span>
        </div>
      ) : (
        <ScrollArea className="h-[50vh] md:h-auto">
          <div className="grid gap-3 pr-4">
            {laboratories.map((lab) => (
              <Card
                key={lab._id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50 active:scale-[0.98]"
                onClick={() => handleLaboratorySelect(lab)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <h4 className="font-medium text-base">{lab.labName}</h4>
                      {lab.headChef && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span>👨‍🍳</span> Chef: {lab.headChef}
                        </p>
                      )}
                      {lab.address && <p className="text-xs text-muted-foreground line-clamp-2">{lab.address}</p>}
                    </div>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {products.filter((p) => p.laboratory === lab.labName).length} produits
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  const renderProductsStep = () => (
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Produits disponibles</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentStep("laboratory")} className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Changer de</span> laboratoire
          </Button>
        </div>

        {/* Mobile-friendly action buttons */}
        {filteredProducts.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllProducts} className="flex-1 text-xs bg-transparent">
              Tout sélectionner
            </Button>
            {orderProducts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllProducts}
                className="flex-1 text-xs bg-transparent"
              >
                Tout désélectionner
              </Button>
            )}
          </div>
        )}
      </div>

      {selectedLaboratory && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{selectedLaboratory.labName}</strong> sélectionné
          </AlertDescription>
        </Alert>
      )}

      {isLoadingProducts ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">Chargement des produits...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Aucun produit disponible pour ce laboratoire.</AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[40vh] md:h-auto">
          <div className="grid gap-3 pr-4">
            {filteredProducts.map((product) => {
              const orderItem = orderProducts.find((item) => item.productName === product.name)
              const isSelected = !!orderItem
              const quantity = orderItem?.quantity || 0

              return (
                <Card
                  key={product._id}
                  className={`transition-all duration-200 ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:shadow-sm"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Product header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addProductToOrder(product._id)
                              } else {
                                const index = orderProducts.findIndex((item) => item.productName === product.name)
                                if (index >= 0) removeItem(index)
                              }
                            }}
                            className="w-5 h-5 mt-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-base">{product.name}</h4>
                              {product.category && (
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Product details and quantity controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="font-medium text-primary">{formatPrice(product.unitPrice)}</span>
                            {product.preparationTime && <span className="text-xs">⏱️ {product.preparationTime}min</span>}
                          </div>
                        </div>

                        {/* Enhanced quantity controls */}
                        {isSelected ? (
                          <div className="space-y-2">
                            {/* Mobile-friendly quantity controls */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Quantité:</span>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 bg-transparent border-2"
                                  onClick={() => {
                                    const index = orderProducts.findIndex((item) => item.productName === product.name)
                                    if (index >= 0) updateItemQuantity(index, quantity - 1)
                                  }}
                                  disabled={quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>

                                {/* Direct quantity input */}
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQuantity = Number.parseInt(e.target.value) || 1
                                      if (newQuantity >= 1 && newQuantity <= 999) {
                                        const index = orderProducts.findIndex(
                                          (item) => item.productName === product.name,
                                        )
                                        if (index >= 0) updateItemQuantity(index, newQuantity)
                                      }
                                    }}
                                    className="w-16 text-center font-medium border-2 focus:border-primary"
                                  />
                                </div>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 bg-transparent border-2"
                                  onClick={() => {
                                    const index = orderProducts.findIndex((item) => item.productName === product.name)
                                    if (index >= 0) updateItemQuantity(index, quantity + 1)
                                  }}
                                  disabled={quantity >= 999}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Quick quantity buttons */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Quantités rapides:</span>
                              <div className="flex gap-1">
                                {[5, 10, 25, 50].map((quickQty) => (
                                  <Button
                                    key={quickQty}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-transparent"
                                    onClick={() => {
                                      const index = orderProducts.findIndex((item) => item.productName === product.name)
                                      if (index >= 0) updateItemQuantity(index, quickQty)
                                    }}
                                  >
                                    {quickQty}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Subtotal display */}
                            <div className="flex items-center justify-between pt-2 border-t border-muted">
                              <span className="text-sm text-muted-foreground">Sous-total:</span>
                              <span className="font-bold text-primary">
                                {formatPrice(quantity * product.unitPrice)}
                              </span>
                            </div>

                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const index = orderProducts.findIndex((item) => item.productName === product.name)
                                if (index >= 0) removeItem(index)
                              }}
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Retirer du panier
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addProductToOrder(product._id)} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter au panier
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Enhanced mobile-friendly order summary */}
      {orderProducts.length > 0 && (
        <Card className="border-primary sticky bottom-0 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Panier ({orderProducts.length} produit{orderProducts.length !== 1 ? "s" : ""})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrderProducts([])}
                className="text-destructive hover:text-destructive text-xs"
              >
                <Trash className="h-4 w-4 mr-1" />
                Vider
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Enhanced product list for mobile */}
            <ScrollArea className="max-h-40">
              <div className="space-y-3">
                {orderProducts.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPrice(item.pricePerUnit)} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{formatPrice(item.totalPrice)}</div>
                        </div>
                      </div>

                      {/* Inline quantity controls for cart */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max="999"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = Number.parseInt(e.target.value) || 1
                              if (newQuantity >= 1 && newQuantity <= 999) {
                                updateItemQuantity(index, newQuantity)
                              }
                            }}
                            className="w-14 h-7 text-center text-xs font-medium"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= 999}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Enhanced summary totals */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Articles sélectionnés:</span>
                  <span className="font-medium">{orderProducts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quantité totale:</span>
                  <span className="font-medium">{orderProducts.reduce((total, item) => total + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary/20">
                  <span>Total commande:</span>
                  <span className="text-primary">{formatPrice(calculateTotalPrice())}</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setCurrentStep("details")}
              disabled={orderProducts.length === 0}
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuer ({orderProducts.reduce((total, item) => total + item.quantity, 0)} articles)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Add a new function for bulk quantity operations:

  const setBulkQuantity = (productName: string, quantity: number) => {
    const index = orderProducts.findIndex((item) => item.productName === productName)
    if (index >= 0) {
      updateItemQuantity(index, quantity)
    }
  }

  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Détails de la commande</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentStep("products")} className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Retour aux</span> produits
          </Button>
        </div>
      </div>

      {/* Bakery Name Input */}
      <div className="space-y-2">
        <Label htmlFor="bakeryName">Nom de la boulangerie</Label>
        <Input
          type="text"
          id="bakeryName"
          value={bakeryName}
          onChange={(e) => setBakeryName(e.target.value)}
          placeholder="Entrez le nom de la boulangerie"
        />
      </div>

      {/* Scheduled Date Picker */}
      <div className="space-y-2">
        <Label>Date de livraison prévue</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className={format(scheduledDate || new Date(), "PPP", { locale: fr })}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>{scheduledDate ? format(scheduledDate, "PPP", { locale: fr }) : "Sélectionner une date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Delivery Address Textarea */}
      <div className="space-y-2">
        <Label htmlFor="address">Adresse de livraison</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Entrez l'adresse de livraison"
        />
      </div>

      {/* Order Notes Textarea */}
      <div className="space-y-2">
        <Label htmlFor="orderNotes">Notes de commande</Label>
        <Textarea
          id="orderNotes"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Ajouter des notes à la commande"
        />
      </div>

      {/* Order Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Récapitulatif de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderProducts.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span>
                {item.productName} ({item.quantity})
              </span>
              <span>{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(calculateTotalPrice())}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

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

  const OrderCard = ({ order }: { order: Order }) => {
    return (
      <Card className="border-2 hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {order.orderReferenceId} - {order.bakeryName}
          </CardTitle>
          <StatusBadge status={order.status} />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Date prévue:</span>
              <span>{formatDate(order.scheduledDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livreur:</span>
              <span>{order.deliveryUserName}</span>
            </div>
            <div className="flex justify-between">
              <span>Produits:</span>
              <span>{order.products.length}</span>
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

  // Return your complete UI with mobile enhancements
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
              <Button className="w-full sm:w-auto" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                <span>Nouvelle commande</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] p-0">
              <div className="flex flex-col h-full">
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="text-xl">Créer une nouvelle commande</DialogTitle>
                  <DialogDescription>
                    {currentStep === "laboratory" && "Sélectionnez d'abord un laboratoire"}
                    {currentStep === "products" && "Choisissez les produits à commander"}
                    {currentStep === "details" && "Complétez les détails de votre commande"}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 px-6">
                  {/* Enhanced mobile progress indicator */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div
                        className={`flex items-center ${currentStep === "laboratory" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${
                            currentStep === "laboratory"
                              ? "border-primary bg-primary text-white"
                              : selectedLaboratory
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground"
                          }`}
                        >
                          1
                        </div>
                        <span className="ml-2 text-xs sm:text-sm font-medium hidden sm:inline">Laboratoire</span>
                      </div>
                      <div className="w-4 sm:w-8 h-px bg-muted-foreground"></div>
                      <div
                        className={`flex items-center ${currentStep === "products" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${
                            currentStep === "products"
                              ? "border-primary bg-primary text-white"
                              : orderProducts.length > 0
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground"
                          }`}
                        >
                          2
                        </div>
                        <span className="ml-2 text-xs sm:text-sm font-medium hidden sm:inline">Produits</span>
                      </div>
                      <div className="w-4 sm:w-8 h-px bg-muted-foreground"></div>
                      <div
                        className={`flex items-center ${currentStep === "details" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${
                            currentStep === "details"
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground"
                          }`}
                        >
                          3
                        </div>
                        <span className="ml-2 text-xs sm:text-sm font-medium hidden sm:inline">Détails</span>
                      </div>
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="pb-4">
                    {currentStep === "laboratory" && renderLaboratoryStep()}
                    {currentStep === "products" && renderProductsStep()}
                    {currentStep === "details" && renderDetailsStep()}
                  </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetOrderForm()
                        setIsCreateDialogOpen(false)
                      }}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Annuler
                    </Button>
                    {currentStep === "details" && (
                      <Button
                        onClick={handleCreateOrder}
                        disabled={
                          !selectedLaboratory ||
                          orderProducts.length === 0 ||
                          !bakeryName ||
                          !scheduledDate ||
                          !address ||
                          isSubmitting
                        }
                        className="w-full sm:w-auto"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Commander ({formatPrice(calculateTotalPrice())})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main content */}
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
              {isLoading ? (
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
                    <OrderCard key={order._id || order.orderId} order={order} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Order Dialog - Enhanced for mobile */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
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
                </div>
              </ScrollArea>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
