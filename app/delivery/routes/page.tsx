"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MapPin, 
  Navigation, 
  Package, 
  Search, 
  Truck 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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

  // Start a route
  const handleStartRoute = (routeId: string) => {
    const updatedRoutes = routes.map((route) =>
      route.id === routeId ? { ...route, status: "IN_PROGRESS" as const } : route
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
          stop.id === stopId ? { ...stop, status: "COMPLETED" as const } : stop
        )
        
        // Check if all stops are completed
        const allCompleted = updatedStops.every((stop) => stop.status === "COMPLETED")
        
        return {
          ...route,
          stops: updatedStops,
          status: allCompleted ? "COMPLETED" as const : route.status,
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
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Planifié
          </Badge>
        )
      case "IN_PROGRESS":
        return <Badge variant="secondary">En cours</Badge>
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Terminé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get stop status badge
  const getStopBadge = (status: DeliveryStop["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            En attente
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Livré
          </Badge>
        )
      case "DELAYED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Retardé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout role="delivery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Itinéraires</h1>
            <p className="text-muted-foreground">Gérez vos itinéraires de livraison</p>
          </div>
        </div>

        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

          <TabsContent value="upcoming" className="space-y-4">
            {filteredRoutes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Aucun itinéraire à venir trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredRoutes.map((route) => (
                <Card key={route.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{route.name}</CardTitle>
                        <CardDescription>
                          {formatDate(route.date)} • {route.stops.length} arrêts
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRouteBadge(route.status)}
                        {route.status === "PLANNED" ? (
                          <Button size="sm" onClick={() => handleStartRoute(route.id)}>
                            <Navigation className="mr-2 h-4 w-4" /> Démarrer
                          </Button>
                        ) : route.status === "IN_PROGRESS" ? (
                          <Button size="sm" variant="outline">
                            <MapPin className="mr-2 h-4 w-4" /> Voir sur la carte
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Heure</TableHead>
                            <TableHead>Boulangerie</TableHead>
                            <TableHead>Adresse</TableHead>
                            <TableHead>Commande</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {route.stops.map((stop) => (
                            <TableRow key={stop.id}>
                              <TableCell>{stop.scheduledTime}</TableCell>
                              <TableCell className="font-medium">{stop.bakeryName}</TableCell>
                              <TableCell className="max-w-xs truncate">{stop.address}</TableCell>
                              <TableCell>{stop.orderReferenceId}</TableCell>
                              <TableCell>{getStopBadge(stop.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRoute(route)
                                      setIsRouteDetailsOpen(true)
                                    }}
                                  >
                                    Détails
                                  </Button>
                                  {route.status === "IN_PROGRESS" && stop.status === "PENDING" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCompleteStop(route.id, stop.id)}
                                    >
                                      Livré <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filteredRoutes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Aucun itinéraire terminé trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredRoutes.map((route) => (
                <Card key={route.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{route.name}</CardTitle>
                        <CardDescription>
                          {formatDate(route.date)} • {route.stops.length} arrêts
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRouteBadge(route.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRoute(route)
                            setIsRouteDetailsOpen(true)
                          }}
                        >
                          Voir le rapport
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Heure</TableHead>
                            <TableHead>Boulangerie</TableHead>
                            <TableHead>Adresse</TableHead>
                            <TableHead>Commande</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {route.stops.map((stop) => (
                            <TableRow key={stop.id}>
                              <TableCell>{stop.scheduledTime}</TableCell>
                              <TableCell className="font-medium">{stop.bakeryName}</TableCell>
                              <TableCell className="max-w-xs truncate">{stop.address}</TableCell>
                              <TableCell>{stop.orderReferenceId}</TableCell>
                              <TableCell>{getStopBadge(stop.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isRouteDetailsOpen} onOpenChange={setIsRouteDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Détails de l'itinéraire</DialogTitle>
              <DialogDescription>
                {selectedRoute && `${selectedRoute.name} - ${formatDate(selectedRoute.date)}`}
              </DialogDescription>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
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
                      <CardTitle className="text-sm">Produits livrés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedRoute.stops.reduce(
                          (total, stop) => total + stop.items.reduce((sum, item) => sum + item.quantity, 0),
                          0
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Détail des arrêts</h3>
                  {selectedRoute.stops.map((stop) => (
                    <Card key={stop.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{stop.bakeryName}</CardTitle>
                            <CardDescription className="flex items-center">
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
                      <CardContent className="pb-2">
                        <div className="space-y-1 text-sm">
                          <div className="font-medium mb-1">Produits:</div>
                          {stop.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="font-medium">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRouteDetailsOpen(false)}>
                Fermer
              </Button>
              {selectedRoute?.status === "COMPLETED" && (
                <Button>
                  Télécharger le rapport <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}