"use client"

import { useState } from "react"
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

// Define delivery route type
interface DeliveryStop {
  id: string
  orderReferenceId: string
  bakeryName: string
  address: string
  scheduledTime: string
  status: "PENDING" | "COMPLETED" | "DELAYED"
  items: {
    name: string
    quantity: number
  }[]
}

interface DeliveryRoute {
  id: string
  date: string
  name: string
  stops: DeliveryStop[]
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
}

// Sample data
const initialRoutes: DeliveryRoute[] = [
  {
    id: "1",
    date: "2025-04-23",
    name: "Route matinale - Centre",
    status: "PLANNED",
    stops: [
      {
        id: "1",
        orderReferenceId: "CMD-2025-001",
        bakeryName: "Boulangerie Saint-Michel",
        address: "12 Rue de la Paix, Paris",
        scheduledTime: "07:00",
        status: "PENDING",
        items: [
          { name: "Baguette Tradition", quantity: 50 },
          { name: "Pain au Chocolat", quantity: 30 },
        ],
      },
      {
        id: "2",
        orderReferenceId: "CMD-2025-002",
        bakeryName: "Boulangerie Montmartre",
        address: "45 Avenue des Champs-Élysées, Paris",
        scheduledTime: "08:30",
        status: "PENDING",
        items: [
          { name: "Baguette Tradition", quantity: 40 },
          { name: "Croissant", quantity: 25 },
          { name: "Pain aux Céréales", quantity: 15 },
        ],
      },
      {
        id: "3",
        orderReferenceId: "CMD-2025-003",
        bakeryName: "Boulangerie Opéra",
        address: "8 Boulevard Haussmann, Paris",
        scheduledTime: "09:15",
        status: "PENDING",
        items: [
          { name: "Baguette Tradition", quantity: 30 },
          { name: "Pain au Chocolat", quantity: 20 },
          { name: "Croissant", quantity: 20 },
        ],
      },
    ],
  },
  {
    id: "2",
    date: "2025-04-23",
    name: "Route après-midi - Est",
    status: "PLANNED",
    stops: [
      {
        id: "4",
        orderReferenceId: "CMD-2025-004",
        bakeryName: "Boulangerie Bastille",
        address: "22 Rue de Rivoli, Paris",
        scheduledTime: "14:30",
        status: "PENDING",
        items: [
          { name: "Baguette Tradition", quantity: 25 },
          { name: "Pain aux Céréales", quantity: 10 },
        ],
      },
      {
        id: "5",
        orderReferenceId: "CMD-2025-005",
        bakeryName: "Boulangerie République",
        address: "35 Place de la République, Paris",
        scheduledTime: "15:45",
        status: "PENDING",
        items: [
          { name: "Baguette Tradition", quantity: 45 },
          { name: "Pain au Chocolat", quantity: 35 },
          { name: "Croissant", quantity: 30 },
        ],
      },
    ],
  },
  {
    id: "3",
    date: "2025-04-22",
    name: "Route matinale - Centre",
    status: "COMPLETED",
    stops: [
      {
        id: "6",
        orderReferenceId: "CMD-2025-006",
        bakeryName: "Boulangerie Louvre",
        address: "2 Rue du Louvre, Paris",
        scheduledTime: "07:30",
        status: "COMPLETED",
        items: [
          { name: "Baguette Tradition", quantity: 35 },
          { name: "Pain au Chocolat", quantity: 25 },
        ],
      },
      {
        id: "7",
        orderReferenceId: "CMD-2025-007",
        bakeryName: "Boulangerie Trocadéro",
        address: "15 Avenue du Président Wilson, Paris",
        scheduledTime: "08:45",
        status: "COMPLETED",
        items: [
          { name: "Baguette Tradition", quantity: 30 },
          { name: "Croissant", quantity: 40 },
        ],
      },
      {
        id: "8",
        orderReferenceId: "CMD-2025-008",
        bakeryName: "Boulangerie Concorde",
        address: "1 Place de la Concorde, Paris",
        scheduledTime: "10:00",
        status: "COMPLETED",
        items: [
          { name: "Baguette Tradition", quantity: 25 },
          { name: "Pain au Chocolat", quantity: 30 },
          { name: "Pain aux Céréales", quantity: 15 },
        ],
      },
    ],
  },
]

export default function RoutesPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>(initialRoutes)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null)
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false)
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Filter routes based on search term and active tab
  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.stops.some((stop) => stop.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab =
      (activeTab === "upcoming" && route.status !== "COMPLETED") ||
      (activeTab === "completed" && route.status === "COMPLETED")

    return matchesSearch && matchesTab
  })

  // Toggle route expansion
  const toggleRouteExpansion = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId)
    } else {
      newExpanded.add(routeId)
    }
    setExpandedRoutes(newExpanded)
  }

  // Start a route
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

  // Complete a stop
  const handleCompleteStop = (routeId: string, stopId: string) => {
    const updatedRoutes = routes.map((route) => {
      if (route.id === routeId) {
        const updatedStops = route.stops.map((stop) =>
          stop.id === stopId ? { ...stop, status: "COMPLETED" as const } : stop,
        )

        // Check if all stops are completed
        const allCompleted = updatedStops.every((stop) => stop.status === "COMPLETED")

        return {
          ...route,
          stops: updatedStops,
          status: allCompleted ? ("COMPLETED" as const) : route.status,
        }
      }
      return route
    })

    setRoutes(updatedRoutes)
    toast({
      title: "Arrêt terminé",
      description: "La livraison a été marquée comme terminée",
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Get status badge
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

  // Get stop status badge
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

  // Mobile filter component
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
          <h3 className="font-medium">Filtrer les itinéraires</h3>
          <div className="space-y-2">
            <Button
              variant={activeTab === "upcoming" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("upcoming")}
            >
              À venir
            </Button>
            <Button
              variant={activeTab === "completed" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("completed")}
            >
              Terminés
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Route card component for mobile
  const RouteCard = ({ route }: { route: DeliveryRoute }) => {
    const isExpanded = expandedRoutes.has(route.id)
    const completedStops = route.stops.filter((stop) => stop.status === "COMPLETED").length
    const totalItems = route.stops.reduce(
      (total, stop) => total + stop.items.reduce((sum, item) => sum + item.quantity, 0),
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
                          </div>
                          <div className="flex items-center gap-2">{getStopBadge(stop.status)}</div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-medium">Produits:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                            {stop.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="font-medium">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {route.status === "IN_PROGRESS" && stop.status === "PENDING" && (
                          <Button size="sm" onClick={() => handleCompleteStop(route.id, stop.id)} className="w-full">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marquer comme livré
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

  return (
    <DashboardLayout role="delivery">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Itinéraires</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gérez vos itinéraires de livraison</p>
          </div>
        </div>

        {/* Mobile and Desktop Navigation */}
        <div className="space-y-4">
          {/* Mobile filters */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileFilters />
            <div className="text-sm text-muted-foreground">
              {filteredRoutes.length} itinéraire{filteredRoutes.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Desktop tabs */}
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="upcoming">À venir</TabsTrigger>
                <TabsTrigger value="completed">Terminés</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un itinéraire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </Tabs>

          {/* Mobile search */}
          <div className="flex items-center gap-2 md:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un itinéraire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Routes Content */}
        <div className="space-y-4">
          {filteredRoutes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2 text-center">
                  {activeTab === "upcoming" ? "Aucun itinéraire à venir trouvé" : "Aucun itinéraire terminé trouvé"}
                </p>
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
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'itinéraire</DialogTitle>
              <DialogDescription>
                {selectedRoute && `${selectedRoute.name} - ${formatDate(selectedRoute.date)}`}
              </DialogDescription>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          (total, stop) => total + stop.items.reduce((sum, item) => sum + item.quantity, 0),
                          0,
                        )}
                      </div>
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
                            <div className="text-sm font-medium">Commande: {stop.orderReferenceId}</div>
                            <div className="space-y-1 text-sm">
                              <div className="font-medium">Produits:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {stop.items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
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
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
