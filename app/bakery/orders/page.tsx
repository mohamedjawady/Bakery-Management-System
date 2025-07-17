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
  ShoppingBag,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getProducts } from "@/lib/api/products"
import type { Product } from "@/types/product"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"

// Updated OrderProduct interface to align with backend schema
interface OrderProduct {
  productName: string
  productRef?: string // From backend
  laboratory: string // From backend, also sent by frontend
  unitPriceHT?: number // From backend
  unitPriceTTC: number // From backend, frontend will use `product.unitPrice` for this
  taxRate?: number // From backend
  quantity: number
  totalPriceHT?: number // From backend
  taxAmount?: number // From backend
  totalPriceTTC: number // From backend, frontend will use `product.unitPrice * quantity` for this
  totalPrice: number // For backward compatibility, same as totalPriceTTC. Frontend will use this.
}

interface Order {
  _id: string // FIX: Made _id non-optional as it's a unique database identifier
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
  products: OrderProduct[] // Using the updated OrderProduct interface
  createdAt?: string
  updatedAt?: string
  isDispatched?: boolean
}

interface Bakery {
  _id: string
  bakeryname: string
  bakeryLocation: string
}

interface Laboratory {
  _id: string
  labName: string
  headChef?: string
  address?: string
  isActive: boolean
}

interface DeliveryUser {
  _id?: string
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  role: string
  isActive: boolean
}

export default function BakeryOrdersPage() {
  // State management
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bakeries, setBakeries] = useState<Bakery[]>([])
  const [deliveryUsersFromAPI, setDeliveryUsersFromAPI] = useState<DeliveryUser[]>([])
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

  // Order creation state
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
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [selectedLaboratory, setSelectedLaboratory] = useState<Laboratory | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoadingLabs, setIsLoadingLabs] = useState(false)

  // Product selection state
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "price" | "category">("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Add these new state variables after the existing product selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [bulkQuantity, setBulkQuantity] = useState(1)

  // Add this new state after the existing selection state variables
  const [selectedProductQuantities, setSelectedProductQuantities] = useState<Record<string, number>>({})

  // Fallback data
  const fallbackDeliveryUsers: DeliveryUser[] = [
    { id: "1", name: "Jean Dupont", role: "delivery", isActive: true },
    { id: "2", name: "Marie Martin", role: "delivery", isActive: true },
    { id: "3", name: "Pierre Durand", role: "delivery", isActive: true },
  ]

  // Enhanced product filtering
  const getFilteredProducts = (): Product[] => {
    let filtered = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(productSearchTerm.toLowerCase()),
    )

    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price":
          return a.unitPrice - b.unitPrice
        case "category":
          return (a.category || "").localeCompare(b.category || "")
        default:
          return 0
      }
    })

    return filtered
  }

  const getCategories = (): string[] => {
    const categories = [...new Set(filteredProducts.map((p) => p.category).filter(Boolean))] as string[]
    return categories
  }

  // Data fetching functions (keeping existing implementation)
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
      setProducts([
        {
          _id: "1",
          name: "Croissant",
          description: "Pâte feuilletée pur beurre, croustillant à l'extérieur",
          unitPrice: 1.2,
          category: "Viennoiserie",
          laboratory: "Laboratoire Central Paris",
        },
        {
          _id: "2",
          name: "Baguette française traditionnelle",
          description: "Baguette française traditionnelle avec une croûte dorée et une mie...",
          unitPrice: 2.43,
          category: "Pain",
          laboratory: "Laboratoire Central Paris",
        },
        {
          _id: "3",
          name: "Chausson feuilleté garni de compote de pommes maison",
          description: "Chausson feuilleté garni de compote de pommes maison",
          unitPrice: 0.7,
          category: "Petits-fours",
          laboratory: "Laboratoire Central Paris",
        },
        {
          _id: "4",
          name: "Millefeuille",
          description: "Millefeuille traditionnel à la crème pâtissière",
          unitPrice: 3.04,
          category: "Pâtisserie",
          laboratory: "Laboratoire Central Paris",
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

  const fetchDeliveryUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      const users = await response.json()
      const activeDeliveryUsers = users.filter((user: DeliveryUser) => user.role === "delivery" && user.isActive)
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
      const activeLabs = data.filter((lab: Laboratory) => lab.isActive)
      setLaboratories(activeLabs)
    } catch (error) {
      console.error("Error fetching laboratories:", error)
      setLaboratories([
        {
          _id: "1",
          labName: "Laboratoire Central Paris",
          headChef: "Chef Martin",
          address: "123 Rue de la Boulangerie, Paris",
          isActive: true,
        },
      ])
    } finally {
      setIsLoadingLabs(false)
    }
  }

  // Effects
  useEffect(() => {
    const userData = localStorage.getItem("userInfo") || localStorage.getItem("userData")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.bakeryName) {
          setBakeryName(user.bakeryName)
        }
      } catch (error) {
        // It's possible for userData to be non-JSON or null,
        // so ensure we catch parsing errors.
        console.error("Error parsing user data from localStorage:", error)
      }
    }
  }, [])

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

  useEffect(() => {
    if (selectedLaboratory && products.length > 0) {
      const filtered = products.filter((product) => product.laboratory === selectedLaboratory.labName)
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [selectedLaboratory, products])

  useEffect(() => {
    if (deliveryUserId) {
      const allUsers = [...deliveryUsersFromAPI, ...fallbackDeliveryUsers]
      const user = allUsers.find((user) => user._id === deliveryUserId || user.id === deliveryUserId)
      if (user) {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name
        setDeliveryUserName(userName || "")
      }
    } else {
      setDeliveryUserName("")
    }
  }, [deliveryUserId, deliveryUsersFromAPI])

  // Order filtering
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

  // Order management functions
  const handleLaboratorySelect = (laboratory: Laboratory) => {
    setSelectedLaboratory(laboratory)
    setCurrentStep("products")
  }

  // Update the resetOrderForm function to include the new state
  const resetOrderForm = () => {
    setCurrentStep("laboratory")
    setSelectedLaboratory(null)
    setOrderProducts([])
    setOrderNotes("")
    setBakeryName("")
    setScheduledDate(new Date())
    setAddress("")
    setFilteredProducts([])
    setProductSearchTerm("")
    setSelectedCategory("all")
    setSortBy("name")
    setSelectionMode(false)
    setSelectedProductIds([])
    setBulkQuantity(1)
    setSelectedProductQuantities({})
  }

  const addProductToOrder = (productId: string, initialQuantity = 1) => {
    const product = filteredProducts.find((p) => p._id === productId)
    if (!product) return

    const existingItemIndex = orderProducts.findIndex((item) => item.productName === product.name)

    // FIX: Updated to align with backend OrderProduct structure
    if (existingItemIndex >= 0) {
      const currentQuantity = orderProducts[existingItemIndex].quantity
      const newQuantity = Math.min(999, currentQuantity + initialQuantity)
      updateItemQuantity(existingItemIndex, newQuantity)
    } else {
      const validQuantity = Math.min(999, Math.max(1, initialQuantity))
      setOrderProducts([
        ...orderProducts,
        {
          productName: product.name,
          laboratory: product.laboratory || "Unknown", // Ensure laboratory is always a string
          quantity: validQuantity,
          unitPriceTTC: product.unitPrice, // Assuming product.unitPrice is the TTC price
          totalPriceTTC: product.unitPrice * validQuantity, // Assuming product.unitPrice is the TTC price
          totalPrice: product.unitPrice * validQuantity, // For backward compatibility
          // Other fields (productRef, unitPriceHT, taxRate, totalPriceHT, taxAmount) will be filled by backend
        },
      ])
      toast({
        title: "Produit ajouté",
        description: `${product.name} (${validQuantity}) ajouté au panier`,
      })
    }
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(999, newQuantity))
    if (validQuantity <= 0) {
      removeItem(index)
      return
    }

    const updatedItems = [...orderProducts]
    updatedItems[index].quantity = validQuantity
    // FIX: Use totalPriceTTC for calculation if available, fallback to totalPrice
    updatedItems[index].totalPriceTTC =
      (updatedItems[index].unitPriceTTC || updatedItems[index].totalPrice / updatedItems[index].quantity) *
      validQuantity
    updatedItems[index].totalPrice = updatedItems[index].totalPriceTTC // Keep totalPrice consistent
    setOrderProducts(updatedItems)
  }

  const removeItem = (index: number) => {
    const removedItem = orderProducts[index]
    const updatedItems = [...orderProducts]
    updatedItems.splice(index, 1)
    setOrderProducts(updatedItems)
    toast({
      title: "Produit retiré",
      description: `${removedItem.productName} retiré du panier`,
    })
  }

  const calculateTotalPrice = (): number => {
    return orderProducts.reduce((total, item) => total + item.totalPrice, 0)
  }

  const generateOrderId = (): string => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  const generateReferenceId = (): string => {
    return `CMD-2025-${String(orders.length + 1).padStart(3, "0")}`
  }

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

    const newOrder: Omit<Order, "_id" | "createdAt" | "updatedAt"> = {
      // Omit _id, createdAt, updatedAt for client-side creation
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

      const createdOrder = (await response.json()) as Order // Cast to Order now that _id is guaranteed
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
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
      setIsLoading(false)
    }
  }

  // Utility functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr })
  }

  const formatPrice = (price: number): string => {
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
    toast({
      title: "Panier vidé",
      description: "Tous les produits ont été retirés du panier",
    })
  }

  // Update the toggleProductSelection function
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        // Remove from selection and clear its quantity
        setSelectedProductQuantities((prevQty) => {
          const newQty = { ...prevQty }
          delete newQty[productId]
          return newQty
        })
        return prev.filter((id) => id !== productId)
      } else {
        // Add to selection with default quantity of 1
        setSelectedProductQuantities((prevQty) => ({
          ...prevQty,
          [productId]: 1,
        }))
        return [...prev, productId]
      }
    })
  }

  // Update the selectAllVisibleProducts function
  const selectAllVisibleProducts = () => {
    const visibleProductIds = getFilteredProducts().map((p) => p._id)
    setSelectedProductIds(visibleProductIds)
    // Set default quantity of 1 for all selected products
    const quantities: Record<string, number> = {}
    visibleProductIds.forEach((id) => {
      quantities[id] = selectedProductQuantities[id] || 1
    })
    setSelectedProductQuantities(quantities)
  }

  // Update the clearProductSelection function
  const clearProductSelection = () => {
    setSelectedProductIds([])
    setSelectedProductQuantities({})
  }

  // FIX: Refactored addSelectedProductsToCart to correctly add all selected products
  const addSelectedProductsToCart = () => {
    const newOrderProducts = [...orderProducts] // Create a mutable copy of the current cart
    let productsProcessedCount = 0 // Count all selected products that are processed

    selectedProductIds.forEach((productId) => {
      const product = filteredProducts.find((p) => p._id === productId)
      if (!product) return

      const quantityToAdd = selectedProductQuantities[productId] || 1
      const validQuantity = Math.max(1, Math.min(999, quantityToAdd))

      const existingItemIndex = newOrderProducts.findIndex((item) => item.productName === product.name)

      if (existingItemIndex >= 0) {
        // If product already in cart, update its quantity by adding the new quantity
        newOrderProducts[existingItemIndex] = {
          ...newOrderProducts[existingItemIndex],
          quantity: newOrderProducts[existingItemIndex].quantity + validQuantity,
          totalPriceTTC:
            (newOrderProducts[existingItemIndex].unitPriceTTC || product.unitPrice) *
            (newOrderProducts[existingItemIndex].quantity + validQuantity),
          totalPrice:
            (newOrderProducts[existingItemIndex].unitPriceTTC || product.unitPrice) *
            (newOrderProducts[existingItemIndex].quantity + validQuantity),
        }
      } else {
        // If product not in cart, add it as a new item
        newOrderProducts.push({
          productName: product.name,
          laboratory: product.laboratory || "Unknown",
          quantity: validQuantity,
          unitPriceTTC: product.unitPrice,
          totalPriceTTC: product.unitPrice * validQuantity,
          totalPrice: product.unitPrice * validQuantity,
        })
      }
      productsProcessedCount++ // Increment count for each selected product processed
    })

    // Update the state once with the final array
    setOrderProducts(newOrderProducts)

    // Clear selection states after adding to cart
    setSelectedProductIds([])
    setSelectedProductQuantities({})
    setSelectionMode(false)

    toast({
      title: "Produits ajoutés",
      description: `${productsProcessedCount} produits ajoutés au panier avec leurs quantités respectives`,
    })
  }

  // Add this new function to update individual product quantities
  const updateSelectedProductQuantity = (productId: string, quantity: number) => {
    const validQuantity = Math.max(1, Math.min(999, quantity))
    setSelectedProductQuantities((prev) => ({
      ...prev,
      [productId]: validQuantity,
    }))
  }

  // Add this new function to apply bulk quantity to all selected products
  const applyBulkQuantityToSelected = () => {
    const quantities: Record<string, number> = {}
    selectedProductIds.forEach((id) => {
      quantities[id] = bulkQuantity
    })
    setSelectedProductQuantities(quantities)
    toast({
      title: "Quantités mises à jour",
      description: `Quantité de ${bulkQuantity} appliquée à tous les produits sélectionnés`,
    })
  }

  // Component rendering
  // Update the ProductCard component to handle individual quantities in selection mode
  const ProductCard = ({ product }: { product: Product }) => {
    const orderItem = orderProducts.find((item) => item.productName === product.name)
    const isSelected = !!orderItem
    const isChecked = selectedProductIds.includes(product._id)
    const quantity = orderItem?.quantity || 0
    const selectedQuantity = selectedProductQuantities[product._id] || 1

    return (
      <Card
        className={`transition-all duration-300 hover:shadow-lg ${
          isSelected
            ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10"
            : isChecked && selectionMode
              ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100"
              : "border hover:border-primary/50"
        }`}
      >
        {/* <CardContent className="p-4"> */}
        {/* <img
          src={product.image || "/placeholder.svg?height=128&width=256"}
          alt={product.name}
          width={256}
          height={128}
          className="w-full h-32 object-cover rounded-md mb-3"
        /> */}
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {selectionMode && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleProductSelection(product._id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Sélectionner</span>
                </label>
                {isChecked && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sélectionné
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base leading-tight line-clamp-1">{product.name}</h4>
                  {product.category && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {product.category}
                    </Badge>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                )}
              </div>
              <span className="text-lg font-bold text-primary ml-2">{formatPrice(product.unitPrice)}</span>
            </div>

            {isSelected && !selectionMode && (
              <div className="flex justify-end">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Dans le panier
                </Badge>
              </div>
            )}

            <Separator />

            {selectionMode && isChecked ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-medium text-sm text-blue-800">Quantité sélectionnée:</span>
                  <span className="text-lg font-bold text-blue-800">{selectedQuantity}</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSelectedProductQuantity(product._id, selectedQuantity - 1)}
                    disabled={selectedQuantity <= 1}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    value={selectedQuantity}
                    onChange={(e) => {
                      const newQuantity = Number.parseInt(e.target.value) || 1
                      if (newQuantity >= 1 && newQuantity <= 999) {
                        updateSelectedProductQuantity(product._id, newQuantity)
                      }
                    }}
                    className="w-20 text-center font-bold text-lg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSelectedProductQuantity(product._id, selectedQuantity + 1)}
                    disabled={selectedQuantity >= 999}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((qty) => (
                    <Button
                      key={qty}
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSelectedProductQuantity(product._id, qty)}
                      className="text-xs hover:bg-blue-100"
                    >
                      {qty}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">Sous-total:</span>
                  <span className="font-bold text-blue-800">{formatPrice(selectedQuantity * product.unitPrice)}</span>
                </div>
              </div>
            ) : !selectionMode && !isSelected ? (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 25].map((qty) => (
                    <Button
                      key={qty}
                      variant="outline"
                      size="sm"
                      onClick={() => addProductToOrder(product._id, qty)}
                      className="text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                    >
                      +{qty}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="Qté"
                    className="flex-1 text-center"
                    id={`qty-input-${product._id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const qty = Number.parseInt((e.target as HTMLInputElement).value) || 1
                        addProductToOrder(product._id, qty)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(`qty-input-${product._id}`) as HTMLInputElement
                      const qty = Number.parseInt(input?.value) || 1
                      addProductToOrder(product._id, qty)
                      if (input) input.value = ""
                    }}
                    className="px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : !selectionMode && isSelected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                  <span className="font-medium text-sm">Quantité:</span>
                  <span className="text-lg font-bold text-primary">{quantity}</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const index = orderProducts.findIndex((item) => item.productName === product.name)
                      if (index >= 0) updateItemQuantity(index, quantity - 1)
                    }}
                    disabled={quantity <= 1}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = Number.parseInt(e.target.value) || 1
                      if (newQuantity >= 1 && newQuantity <= 999) {
                        const index = orderProducts.findIndex((item) => item.productName === product.name)
                        if (index >= 0) updateItemQuantity(index, newQuantity)
                      }
                    }}
                    className="w-20 text-center font-bold text-lg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const index = orderProducts.findIndex((item) => item.productName === product.name)
                      if (index >= 0) updateItemQuantity(index, quantity + 1)
                    }}
                    disabled={quantity >= 999}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((qty) => (
                    <Button
                      key={qty}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const index = orderProducts.findIndex((item) => item.productName === product.name)
                        if (index >= 0) updateItemQuantity(index, qty)
                      }}
                      className="text-xs hover:bg-primary/20"
                    >
                      {qty}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium text-green-800">Sous-total:</span>
                    <span className="font-bold text-green-800">{formatPrice(quantity * product.unitPrice)}</span>
                  </div>
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
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )
  }

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
        <div className="grid gap-3">
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
      )}
    </div>
  )

  // Update the renderProductsStep function to fix the order and layout
  const renderProductsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Sélection des produits</h3>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep("laboratory")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Changer de laboratoire
        </Button>
      </div>

      {selectedLaboratory && (
        <Alert className="border-green-200 bg-green-50">
          <Building2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{selectedLaboratory.labName}</strong> - {filteredProducts.length} produits disponibles
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: "name" | "price" | "category") => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection Mode Toggle and Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newSelectionMode = !selectionMode
                    setSelectionMode(newSelectionMode)
                    if (!newSelectionMode) {
                      // Clear selection when exiting selection mode
                      setSelectedProductIds([])
                      setSelectedProductQuantities({})
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {selectionMode ? "Quitter sélection" : "Sélection multiple"}
                </Button>

                {selectionMode && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedProductIds.length} sélectionné{selectedProductIds.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {!selectionMode && getFilteredProducts().length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllProducts} className="text-xs bg-transparent">
                    Tout ajouter (qté 1)
                  </Button>
                  {orderProducts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllProducts}
                      className="text-xs bg-transparent"
                    >
                      Vider le panier
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Selection Controls */}
            {selectionMode && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {/* Selection Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisibleProducts}
                    className="text-xs bg-transparent"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearProductSelection}
                    className="text-xs bg-transparent"
                    disabled={selectedProductIds.length === 0}
                  >
                    Tout désélectionner
                  </Button>

                  {selectedProductIds.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 ml-auto">
                        <Label htmlFor="bulk-quantity" className="text-sm font-medium whitespace-nowrap">
                          Quantité:
                        </Label>
                        <Input
                          id="bulk-quantity"
                          type="number"
                          min="1"
                          max="999"
                          value={bulkQuantity}
                          onChange={(e) => setBulkQuantity(Number.parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />
                        <Button onClick={applyBulkQuantityToSelected} size="sm" variant="outline">
                          Appliquer à tous
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Products Summary */}
                {selectedProductIds.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-800">Produits sélectionnés</h4>
                      <div className="text-sm font-bold text-blue-800">
                        Total:{" "}
                        {formatPrice(
                          selectedProductIds.reduce((total, productId) => {
                            const product = filteredProducts.find((p) => p._id === productId)
                            const quantity = selectedProductQuantities[productId] || 1
                            return total + (product ? product.unitPrice * quantity : 0)
                          }, 0),
                        )}
                      </div>
                    </div>

                    <ScrollArea className="max-h-40 border rounded-md">
                      <div className="space-y-2 p-2">
                        {selectedProductIds.map((productId) => {
                          const product = filteredProducts.find((p) => p._id === productId)
                          const quantity = selectedProductQuantities[productId] || 1
                          if (!product) return null

                          return (
                            <div
                              key={productId}
                              className="flex items-center justify-between p-3 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPrice(product.unitPrice)} × {quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-sm">{formatPrice(product.unitPrice * quantity)}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>

                    <Button onClick={addSelectedProductsToCart} className="w-full" size="lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Ajouter au panier ({selectedProductIds.length} produits)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoadingProducts ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">Chargement des produits...</span>
        </div>
      ) : getFilteredProducts().length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {productSearchTerm || selectedCategory !== "all"
              ? "Aucun produit trouvé avec les filtres actuels."
              : "Aucun produit disponible pour ce laboratoire."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredProducts().map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Shopping Cart Summary */}
      {orderProducts.length > 0 && (
        <Card className="sticky bottom-4 border-primary shadow-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Panier ({orderProducts.length} produits)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAllProducts}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4 mr-1" />
                Vider
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-48">
              <div className="space-y-3">
                {orderProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPriceTTC)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatPrice(item.totalPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="space-y-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span>Articles:</span>
                <span className="font-medium">{orderProducts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantité totale:</span>
                <span className="font-medium">{orderProducts.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(calculateTotalPrice())}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => setCurrentStep("details")} size="lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuer la commande
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderDetailsStep = () => (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <Label>Date de livraison prévue</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
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

      <div className="space-y-2">
        <Label htmlFor="address">Adresse de livraison</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Entrez l'adresse de livraison"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderNotes">Notes de commande</Label>
        <Textarea
          id="orderNotes"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Ajouter des notes à la commande"
          rows={3}
        />
      </div>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Récapitulatif de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {orderProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-sm">{product.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(product.unitPriceTTC)} × {product.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatPrice(product.totalPrice)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(calculateTotalPrice())}</span>
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
            <div className="flex justify-between font-bold text-primary">
              <span>Total:</span>
              <span>{formatPrice(totalPrice)}</span>
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

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
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
            <DialogContent className="w-[95vw] max-w-6xl h-[95vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-4 flex-shrink-0">
                <DialogTitle className="text-xl">Créer une nouvelle commande</DialogTitle>
                <DialogDescription>
                  {currentStep === "laboratory" && "Sélectionnez d'abord un laboratoire"}
                  {currentStep === "products" && "Choisissez les produits et leurs quantités"}
                  {currentStep === "details" && "Complétez les détails de votre commande"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-shrink-0 px-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    {["laboratory", "products", "details"].map((step, index) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-medium ${
                            currentStep === step
                              ? "border-primary bg-primary text-white"
                              : index < ["laboratory", "products", "details"].indexOf(currentStep)
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">
                          {step === "laboratory" ? "Laboratoire" : step === "products" ? "Produits" : "Détails"}
                        </span>
                        {index < 2 && <div className="w-8 h-px bg-muted-foreground mx-4 hidden sm:block"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="pb-4">
                  {currentStep === "laboratory" && renderLaboratoryStep()}
                  {currentStep === "products" && renderProductsStep()}
                  {currentStep === "details" && renderDetailsStep()}
                </div>
              </ScrollArea>

              <DialogFooter className="p-6 pt-4 border-t bg-muted/30 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetOrderForm()
                      setIsCreateDialogOpen(false)
                    }}
                    className="w-full sm:w-auto"
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
            </DialogContent>
          </Dialog>
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
                    // FIX: Use order._id directly as the key, now that it's non-optional in the interface.
                    <OrderCard key={order._id} order={order} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t font-bold text-lg">
                      <span>Total de la commande:</span>
                      <span className="text-primary">
                        {formatPrice(
                          (viewingOrder.products || []).reduce((total, product) => total + product.totalPrice, 0),
                        )}
                      </span>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
