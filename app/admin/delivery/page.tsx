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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Eye, Filter, MapPin, Search, Truck, RefreshCw, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deliveryApi, type Delivery, getStatusLabel, getStatusColor, formatDeliveryDate } from "@/lib/api/deliveries"

// Define order type from API - now using Delivery interface
type Order = Delivery & {
  referenceId?: string
  customerName?: string
  items?: any[]
  totalAmount?: number
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  // Fetch orders from API using delivery service
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the new delivery API
      const deliveries = await deliveryApi.getAllDeliveries()

      // Map delivery data to Order interface
      const mappedOrders: Order[] = deliveries.map((delivery) => ({
        ...delivery,
        id: delivery._id,
        referenceId: delivery.orderReferenceId,
        customerName: delivery.deliveryUserName,
      }))

      setOrders(mappedOrders)
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

  // Load orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bakeryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ready" && order.status === "READY_FOR_DELIVERY") ||
      (activeTab === "delivered" && order.status === "DELIVERED")

    return matchesSearch && matchesStatus && matchesTab
  })
  // Handle status update using delivery API
  const handleUpdateStatus = async () => {
    if (!orderToUpdate || !newStatus) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un statut",
        variant: "destructive",
      })
      return
    }

    try {
      // Use the delivery API to update status
      const updatedDelivery = await deliveryApi.updateDeliveryStatus(orderToUpdate._id, {
        status: newStatus as Delivery['status'],
      })

      // Update local state
      const updatedOrders = orders.map((order) =>
        order._id === orderToUpdate._id
          ? {
              ...order,
              status: updatedDelivery.status,
              actualDeliveryDate: updatedDelivery.actualDeliveryDate,
            }
          : order,
      )
      
      setOrders(updatedOrders)
      setIsUpdateStatusDialogOpen(false)
      setOrderToUpdate(null)
      setNewStatus("")
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut de la livraison a été mis à jour avec succès`,
      })
    } catch (err) {
      console.error("Error updating delivery status:", err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    }
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_DELIVERY":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Prêt pour livraison
          </Badge>
        )
      case "DELIVERED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Livré
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get counts for each status
  const readyCount = orders.filter((order) => order.status === "READY_FOR_DELIVERY").length
  const deliveredCount = orders.filter((order) => order.status === "DELIVERED").length

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement des commandes...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Livraisons</h1>
            <p className="text-muted-foreground">Gérez les commandes prêtes pour livraison et livrées</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erreur lors du chargement: {error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">Toutes ({orders.length})</TabsTrigger>
            <TabsTrigger value="ready">Prêtes ({readyCount})</TabsTrigger>
            <TabsTrigger value="delivered">Livrées ({deliveredCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une commande..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="READY_FOR_DELIVERY">Prêt pour livraison</SelectItem>
                        <SelectItem value="DELIVERED">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Boulangerie</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date prévue</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            {orders.length === 0 ? "Aucune commande disponible" : "Aucune commande trouvée"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.bakeryName || "Non défini"}</TableCell>
                            <TableCell>{order.customerName || order.deliveryUserName || "Non défini"}</TableCell>
                            <TableCell>{formatDate(order.scheduledDate)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog
                                  open={isViewDialogOpen && viewingOrder?.id === order.id}
                                  onOpenChange={(open) => {
                                    setIsViewDialogOpen(open)
                                    if (open) setViewingOrder(order)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Voir</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Détails de la commande</DialogTitle>
                                    </DialogHeader>
                                    {viewingOrder && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <h3 className="font-medium">Informations générales</h3>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Référence:</span>
                                                <span>{viewingOrder.orderReferenceId}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Boulangerie:</span>
                                                <span>{viewingOrder.bakeryName || "Non défini"}</span>
                                              </div>
                                              {/* <div className="flex justify-between">
                                                <span className="text-muted-foreground">Client:</span>
                                                <span>{viewingOrder.bakeryName || "Non défini"}</span>
                                              </div> */}
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Statut:</span>
                                                <span>{getStatusBadge(viewingOrder.status)}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">Dates</h3>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date prévue:</span>
                                                <span>{formatDate(viewingOrder.scheduledDate)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date effective:</span>
                                                <span>
                                                  {viewingOrder.actualDeliveryDate
                                                    ? formatDate(viewingOrder.actualDeliveryDate)
                                                    : "Non livrée"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {viewingOrder.address && (
                                          <div>
                                            <h3 className="font-medium">Adresse de livraison</h3>
                                            <p className="mt-2 flex items-center gap-2">
                                              <MapPin className="h-4 w-4 text-muted-foreground" />
                                              {viewingOrder.address}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <h3 className="font-medium">Notes</h3>
                                          <p className="mt-2 text-sm">{viewingOrder.notes || "Aucune note"}</p>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                {order.status === "READY_FOR_DELIVERY" && (
                                  <Dialog
                                    open={isUpdateStatusDialogOpen && orderToUpdate?.id === order.id}
                                    onOpenChange={(open) => {
                                      setIsUpdateStatusDialogOpen(open)
                                      if (open) {
                                        setOrderToUpdate(order)
                                        setNewStatus(order.status)
                                      }
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Truck className="h-4 w-4" />
                                        <span className="sr-only">Mettre à jour</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Mettre à jour le statut</DialogTitle>
                                        <DialogDescription>
                                          Modifiez le statut de la commande {order.referenceId}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="status">Statut</Label>
                                          <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger id="status">
                                              <SelectValue placeholder="Sélectionnez un statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="READY_FOR_DELIVERY">Prêt pour livraison</SelectItem>
                                              <SelectItem value="DELIVERED">Livré</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        {newStatus === "DELIVERED" && (
                                          <div className="grid gap-2">
                                            <Label htmlFor="delivery-time">Heure de livraison</Label>
                                            <Input
                                              id="delivery-time"
                                              type="datetime-local"
                                              defaultValue={new Date().toISOString().slice(0, 16)}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                                          Annuler
                                        </Button>
                                        <Button onClick={handleUpdateStatus}>Mettre à jour</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Commandes prêtes pour livraison</CardTitle>
                <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Boulangerie</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date prévue</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Aucune commande prête pour livraison
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.referenceId}</TableCell>
                            <TableCell>{order.bakeryName || "Non défini"}</TableCell>
                            <TableCell>{order.customerName || order.deliveryUserName || "Non défini"}</TableCell>
                            <TableCell>{formatDate(order.scheduledDate)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setViewingOrder(order)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Commandes livrées</CardTitle>
                <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Boulangerie</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date de livraison</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Aucune commande livrée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.referenceId}</TableCell>
                            <TableCell>{order.bakeryName || "Non défini"}</TableCell>
                            <TableCell>{order.customerName || order.deliveryUserName || "Non défini"}</TableCell>
                            <TableCell>{formatDate(order.actualDeliveryDate || order.scheduledDate)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setViewingOrder(order)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
