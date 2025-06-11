"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Navigation,
  Package,
  Search,
  Truck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Euro,
  ShoppingCart,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { deliveryApi, type Delivery, getStatusLabel, getStatusColor, formatDeliveryDate } from "@/lib/api/deliveries"

// Enhanced product interface matching your schema
interface Product {
  productName: string
  pricePerUnit: number
  quantity: number
  totalPrice: number
}

// Enhanced delivery stop interface
interface DeliveryStop {
  id: string
  orderReferenceId: string
  bakeryName: string
  address: string
  scheduledTime: string
  status: "PENDING" | "COMPLETED" | "DELAYED"
  products: Product[]
  orderId: string
  totalOrderValue: number
  delivery: Delivery // Store the full delivery object
}

interface DeliveryRoute {
  id: string
  date: string
  name: string
  stops: DeliveryStop[]
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
  totalValue: number
}

export default function RoutesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("available")
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null)
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false)
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false)
  const [selectedDeliveryForPickup, setSelectedDeliveryForPickup] = useState<Delivery | null>(null)
  const [currentUserId] = useState("delivery-user-001") // This should come from auth context
  const [currentUserName] = useState("Livreur Principal") // This should come from auth context
  const { toast } = useToast()

  // Fetch deliveries from our delivery API
  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching deliveries from API...")
      const deliveriesData = await deliveryApi.getAllDeliveries()
      
      console.log("Deliveries fetched:", deliveriesData)
      setDeliveries(deliveriesData)

      // Transform deliveries into routes
      const transformedRoutes = transformDeliveriesToRoutes(deliveriesData)
      setRoutes(transformedRoutes)

    } catch (err) {
      console.error("Error fetching deliveries:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch deliveries")
      toast({
        title: "Erreur",
        description: "Impossible de charger les livraisons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  // Enhanced transformation with delivery data
  const transformDeliveriesToRoutes = (deliveries: Delivery[]): DeliveryRoute[] => {
    // Filter deliveries based on active tab
    const filteredDeliveries = deliveries.filter(delivery => {
      switch (activeTab) {
        case "available":
          return delivery.status === "READY_FOR_DELIVERY"
        case "my-orders":
          return delivery.status === "IN_TRANSIT" && delivery.deliveryUserId === currentUserId
        case "completed":
          return delivery.status === "DELIVERED"
        default:
          return true
      }
    })

    const deliveriesByDate = filteredDeliveries.reduce(
      (acc, delivery) => {
        const date = delivery.scheduledDate ? delivery.scheduledDate.split("T")[0] : new Date().toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(delivery)
        return acc
      },
      {} as Record<string, Delivery[]>,
    )

    return Object.entries(deliveriesByDate)
      .map(([date, dateDeliveries], index) => {
        const stops: DeliveryStop[] = dateDeliveries.map((delivery) => {
          const totalOrderValue = delivery.products?.reduce((sum, product) => sum + product.totalPrice, 0) || 0

          return {
            id: delivery._id,
            orderReferenceId: delivery.orderReferenceId,
            bakeryName: delivery.bakeryName || "Boulangerie",
            address: delivery.address || "Adresse non définie",
            scheduledTime: delivery.scheduledDate
              ? new Date(delivery.scheduledDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
              : "Non défini",
            status: delivery.status === "DELIVERED" ? "COMPLETED" : "PENDING",
            products: delivery.products || [],
            orderId: delivery.orderId,
            totalOrderValue,
            delivery, // Store the full delivery object for API calls
          }
        })

        stops.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

        const totalValue = stops.reduce((sum, stop) => sum + stop.totalOrderValue, 0)

        return {
          id: `route-${date}-${index}`,
          date,
          name: `Livraisons ${formatDate(date)}`,
          stops,          status: stops.every(stop => stop.status === "COMPLETED") ? "COMPLETED" as const : 
                  stops.some(stop => stop.delivery.status === "IN_TRANSIT") ? "IN_PROGRESS" as const : "PLANNED" as const,
          totalValue,
        }      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  useEffect(() => {
    fetchDeliveries()
  }, [])

  useEffect(() => {
    // Update routes when tab changes
    const transformedRoutes = transformDeliveriesToRoutes(deliveries)
    setRoutes(transformedRoutes)
  }, [activeTab, deliveries])
  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.stops.some(
        (stop) =>
          stop.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stop.products.some((product) => product.productName.toLowerCase().includes(searchTerm.toLowerCase())),
      )

    const matchesTab =
      (activeTab === "available") ||
      (activeTab === "my-orders" && route.status !== "COMPLETED") ||
      (activeTab === "completed" && route.status === "COMPLETED")

    return matchesSearch && matchesTab
  })

  const toggleRouteExpansion = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId)
    } else {
      newExpanded.add(routeId)
    }
    setExpandedRoutes(newExpanded)
  }

  const handleStartRoute = (routeId: string) => {
    const updatedRoutes = routes.map((route) =>
      route.id === routeId ? { ...route, status: "IN_PROGRESS" as const } : route,
    )
    setRoutes(updatedRoutes)
    toast({
      title: "Itinéraire démarré",
      description: "Vous avez commencé votre itinéraire de livraison",
    })
  }

  const handleCompleteStop = async (routeId: string, stopId: string) => {
    try {
      const route = routes.find((r) => r.id === routeId)
      const stop = route?.stops.find((s) => s.id === stopId)

      if (stop) {        // Update delivery status to DELIVERED via API
        await deliveryApi.updateDeliveryStatus(stop.delivery._id, { status: "DELIVERED" })
        
        // Refresh deliveries to get updated data
        await fetchDeliveries()

        toast({
          title: "Livraison terminée",
          description: `Commande ${stop.orderReferenceId} marquée comme livrée`,
        })
      }
    } catch (error) {
      console.error("Error completing delivery:", error)
      toast({
        title: "Erreur",
        description: "Impossible de marquer la livraison comme terminée",
        variant: "destructive",
      })
    }
  }

  const handlePickupDelivery = async (delivery: Delivery) => {
    try {      // Update delivery status to IN_TRANSIT and assign to current user
      await deliveryApi.assignDeliveryUser(delivery._id, { deliveryUserId: currentUserId, deliveryUserName: currentUserName })
      await deliveryApi.updateDeliveryStatus(delivery._id, { status: "IN_TRANSIT" })

      // Refresh deliveries to get updated data
      await fetchDeliveries()

      toast({
        title: "Commande récupérée",
        description: `Commande ${delivery.orderReferenceId} assignée et en transit`,
      })

      setIsPickupDialogOpen(false)
      setSelectedDeliveryForPickup(null)
    } catch (error) {
      console.error("Error picking up delivery:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la commande",
        variant: "destructive",
      })
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  const getRouteBadge = (status: DeliveryRoute["status"]) => {
    switch (status) {
      case "PLANNED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            Planifié
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="secondary" className="text-xs">
            En cours
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Terminé
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getStopBadge = (status: DeliveryStop["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            En attente
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Livré
          </Badge>
        )
      case "DELAYED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            Retardé
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  // Pickup Order Dialog Component
  const PickupOrderDialog = () => (
    <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Récupérer cette commande</DialogTitle>
          <DialogDescription>
            Voulez-vous prendre en charge cette commande pour livraison ?
          </DialogDescription>
        </DialogHeader>        {selectedDeliveryForPickup && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{selectedDeliveryForPickup.bakeryName}</CardTitle>
                <CardDescription>Commande {selectedDeliveryForPickup.orderReferenceId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Adresse:</span>
                  <span className="font-medium">{selectedDeliveryForPickup.address || "Non définie"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date prévue:</span>
                  <span className="font-medium">
                    {selectedDeliveryForPickup.scheduledDate
                      ? formatDeliveryDate(selectedDeliveryForPickup.scheduledDate)
                      : "Non définie"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produits:</span>
                  <span className="font-medium">{selectedDeliveryForPickup.products?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Valeur totale:</span>
                  <span className="text-green-600">
                    {formatPrice(
                      selectedDeliveryForPickup.products?.reduce((sum, product) => sum + product.totalPrice, 0) || 0
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Alert>
              <Truck className="h-4 w-4" />
              <AlertDescription>
                En récupérant cette commande, elle vous sera assignée et passera en statut "En transit".
              </AlertDescription>
            </Alert>
          </div>
        )}        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsPickupDialogOpen(false)
              setSelectedDeliveryForPickup(null)
            }}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={() => selectedDeliveryForPickup && handlePickupDelivery(selectedDeliveryForPickup)}
            className="w-full sm:w-auto"
          >
            <Truck className="mr-2 h-4 w-4" />
            Récupérer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Enhanced Product Details Component
  const ProductDetailsDialog = () => (
    <Dialog open={isProductDetailsOpen} onOpenChange={setIsProductDetailsOpen}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails des produits</DialogTitle>
          <DialogDescription>
            {selectedStop && `Commande ${selectedStop.orderReferenceId} - ${selectedStop.bakeryName}`}
          </DialogDescription>
        </DialogHeader>
        {selectedStop && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedStop.products.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quantité totale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedStop.products.reduce((sum, product) => sum + product.quantity, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Valeur totale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatPrice(selectedStop.totalOrderValue)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Liste des produits</h3>
              <div className="space-y-2">
                {selectedStop.products.map((product, index) => (
                  <Card key={index} className="border-l-4 border-l-green-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(product.pricePerUnit)} × {product.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">{formatPrice(product.totalPrice)}</div>
                          <div className="text-xs text-muted-foreground">Quantité: {product.quantity}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Total de la commande:</span>
                <span className="text-xl font-bold text-green-600">{formatPrice(selectedStop.totalOrderValue)}</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsProductDetailsOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  const MobileFilters = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Filtrer les commandes</h3>
          <div className="space-y-2">
            <Button
              variant={activeTab === "available" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("available")}
            >
              Disponibles
            </Button>
            <Button
              variant={activeTab === "my-orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("my-orders")}
            >
              Mes commandes
            </Button>
            <Button
              variant={activeTab === "completed" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("completed")}
            >
              Terminées
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  const RouteCard = ({ route }: { route: DeliveryRoute }) => {
    const isExpanded = expandedRoutes.has(route.id)
    const completedStops = route.stops.filter((stop) => stop.status === "COMPLETED").length
    const totalItems = route.stops.reduce(
      (total, stop) => total + stop.products.reduce((sum, product) => sum + product.quantity, 0),
      0,
    )

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base sm:text-lg">{route.name}</CardTitle>
                <CardDescription className="text-sm">
                  {formatDate(route.date)} • {route.stops.length} arrêts
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">{getRouteBadge(route.status)}</div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{totalItems} produits</span>
                </div>
                <div className="flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  <span>{formatPrice(route.totalValue)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {completedStops}/{route.stops.length}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto">
                {route.status === "PLANNED" && (
                  <Button size="sm" onClick={() => handleStartRoute(route.id)} className="flex-1 sm:flex-none">
                    <Navigation className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Démarrer</span>
                  </Button>
                )}
                {route.status === "IN_PROGRESS" && (
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Carte</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRoute(route)
                    setIsRouteDetailsOpen(true)
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Détails
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <Collapsible open={isExpanded} onOpenChange={() => toggleRouteExpansion(route.id)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-6 py-2">
              <span className="text-sm">Voir les arrêts ({route.stops.length})</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {route.stops.map((stop, index) => (
                  <Card key={stop.id} className="border-l-4 border-l-blue-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm">{stop.bakeryName}</div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {stop.scheduledTime}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{stop.address}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Commande: {stop.orderReferenceId}</div>
                            <div className="text-xs font-medium text-green-600">
                              Valeur: {formatPrice(stop.totalOrderValue)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStopBadge(stop.status)}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium">Produits ({stop.products.length}):</div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStop(stop)
                                setIsProductDetailsOpen(true)
                              }}
                              className="text-xs h-6"
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Voir détails
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {stop.products.slice(0, 3).map((product, productIndex) => (
                              <div
                                key={productIndex}
                                className="flex justify-between items-center p-2 bg-muted/50 rounded"
                              >
                                <span className="font-medium">{product.productName}</span>
                                <div className="text-right">
                                  <div className="font-medium text-green-600">{formatPrice(product.totalPrice)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatPrice(product.pricePerUnit)} × {product.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {stop.products.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center py-1">
                                +{stop.products.length - 3} autres produits
                              </div>
                            )}
                          </div>
                        </div>                        {route.status === "IN_PROGRESS" && stop.status === "PENDING" && (
                          <Button size="sm" onClick={() => handleCompleteStop(route.id, stop.id)} className="w-full">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marquer comme livré
                          </Button>
                        )}

                        {activeTab === "available" && route.status === "PLANNED" && (
                          <Button
                            size="sm"                            onClick={() => {
                              setSelectedDeliveryForPickup(stop.delivery)
                              setIsPickupDialogOpen(true)
                            }}
                            className="w-full"
                            variant="outline"
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Récupérer cette commande
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="delivery">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement des itinéraires...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="delivery">
      <div className="flex flex-col gap-4 p-4 sm:p-6">        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Commandes Disponibles</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Commandes prêtes à être récupérées pour livraison
            </p>
          </div>
          <div className="flex gap-2">            <Button onClick={fetchDeliveries} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erreur lors du chargement: {error}</AlertDescription>
          </Alert>
        )}        {/* Dispatch System Info */}
        {deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length > 0 && (
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              {deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length} commande{deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length !== 1 ? "s" : ""} disponible{deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length !== 1 ? "s" : ""} pour récupération. 
              Cliquez sur "Récupérer cette commande" pour prendre en charge une livraison.
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile and Desktop Navigation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 md:hidden">
            <MobileFilters />
            <div className="text-sm text-muted-foreground">
              {filteredRoutes.length} itinéraire{filteredRoutes.length !== 1 ? "s" : ""}
            </div>
          </div>          <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <div className="flex items-center justify-between">              <TabsList>
                <TabsTrigger value="available">
                  Disponibles ({deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length})
                </TabsTrigger>
                <TabsTrigger value="my-orders">
                  Mes commandes ({deliveries.filter(d => d.status === "IN_TRANSIT" && d.deliveryUserId === currentUserId).length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Terminées ({deliveries.filter(d => d.status === "DELIVERED").length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une commande ou produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </Tabs>

          <div className="flex items-center gap-2 md:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />            <Input
              placeholder="Rechercher une commande ou produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Routes Content */}
        <div className="space-y-4">
          {filteredRoutes.length === 0 ? (
            <Card>              <CardContent className="flex flex-col items-center justify-center py-10">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />                <p className="text-muted-foreground mb-2 text-center">
                  {activeTab === "available" && deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length === 0
                    ? "Aucune commande disponible pour récupération"
                    : activeTab === "my-orders" && deliveries.filter(d => d.status === "IN_TRANSIT" && d.deliveryUserId === currentUserId).length === 0
                    ? "Aucune commande en cours de livraison"
                    : activeTab === "completed" && deliveries.filter(d => d.status === "DELIVERED").length === 0
                    ? "Aucune livraison terminée"
                    : filteredRoutes.length === 0
                    ? "Aucun résultat trouvé"
                    : "Chargement..."}
                </p>
                {activeTab === "available" && deliveries.filter(d => d.status === "READY_FOR_DELIVERY").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Les nouvelles commandes prêtes pour livraison apparaîtront ici automatiquement
                  </p>
                )}
                {activeTab === "my-orders" && deliveries.filter(d => d.status === "IN_TRANSIT" && d.deliveryUserId === currentUserId).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Récupérez des commandes depuis l'onglet "Disponibles" pour commencer vos livraisons
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>

        {/* Route Details Dialog */}
        <Dialog open={isRouteDetailsOpen} onOpenChange={setIsRouteDetailsOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'itinéraire</DialogTitle>
              <DialogDescription>
                {selectedRoute && `${selectedRoute.name} - ${formatDate(selectedRoute.date)}`}
              </DialogDescription>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Arrêts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedRoute.stops.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>{getRouteBadge(selectedRoute.status)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Produits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedRoute.stops.reduce(
                          (total, stop) => total + stop.products.reduce((sum, product) => sum + product.quantity, 0),
                          0,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valeur totale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{formatPrice(selectedRoute.totalValue)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Détail des arrêts</h3>
                  <div className="space-y-3">
                    {selectedRoute.stops.map((stop) => (
                      <Card key={stop.id}>
                        <CardHeader className="pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{stop.bakeryName}</CardTitle>
                              <CardDescription className="flex items-center text-sm">
                                <MapPin className="h-3 w-3 mr-1" />
                                {stop.address}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                {stop.scheduledTime}
                              </div>
                              {getStopBadge(stop.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">Commande: {stop.orderReferenceId}</div>
                              <div className="text-sm font-bold text-green-600">
                                {formatPrice(stop.totalOrderValue)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">Produits ({stop.products.length}):</div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStop(stop)
                                  setIsProductDetailsOpen(true)
                                }}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Voir détails
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsRouteDetailsOpen(false)} className="w-full sm:w-auto">
                Fermer
              </Button>
              {selectedRoute?.status === "COMPLETED" && (
                <Button className="w-full sm:w-auto">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Télécharger le rapport
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>        {/* Product Details Dialog */}
        <ProductDetailsDialog />

        {/* Pickup Order Dialog */}
        <PickupOrderDialog />
      </div>
    </DashboardLayout>
  )
}
