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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Eye, Filter, MapPin, Search, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define delivery type
interface Delivery {
  id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate: string | null
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED"
  notes: string
  address: string
}

// Sample data
const initialDeliveries: Delivery[] = [
  {
    id: "1",
    orderId: "1",
    orderReferenceId: "CMD-2025-001",
    bakeryName: "Boulangerie Saint-Michel",
    deliveryUserId: "6",
    deliveryUserName: "Pierre Dupont",
    scheduledDate: "2025-04-23T07:00:00Z",
    actualDeliveryDate: null,
    status: "PENDING",
    notes: "Livraison avant 7h du matin",
    address: "12 Rue de la Paix, Paris",
  },
  {
    id: "2",
    orderId: "2",
    orderReferenceId: "CMD-2025-002",
    bakeryName: "Boulangerie Montmartre",
    deliveryUserId: "7",
    deliveryUserName: "Marie Lambert",
    scheduledDate: "2025-04-23T08:30:00Z",
    actualDeliveryDate: null,
    status: "IN_TRANSIT",
    notes: "",
    address: "45 Avenue des Champs-Élysées, Paris",
  },
  {
    id: "3",
    orderId: "3",
    orderReferenceId: "CMD-2025-003",
    bakeryName: "Boulangerie Saint-Michel",
    deliveryUserId: "6",
    deliveryUserName: "Pierre Dupont",
    scheduledDate: "2025-04-23T09:15:00Z",
    actualDeliveryDate: null,
    status: "IN_TRANSIT",
    notes: "Commande urgente",
    address: "12 Rue de la Paix, Paris",
  },
  {
    id: "4",
    orderId: "4",
    orderReferenceId: "CMD-2025-004",
    bakeryName: "Boulangerie Montmartre",
    deliveryUserId: "7",
    deliveryUserName: "Marie Lambert",
    scheduledDate: "2025-04-22T10:00:00Z",
    actualDeliveryDate: "2025-04-22T10:15:00Z",
    status: "DELIVERED",
    notes: "",
    address: "45 Avenue des Champs-Élysées, Paris",
  },
  {
    id: "5",
    orderId: "5",
    orderReferenceId: "CMD-2025-005",
    bakeryName: "Boulangerie Saint-Michel",
    deliveryUserId: "6",
    deliveryUserName: "Pierre Dupont",
    scheduledDate: "2025-04-22T07:30:00Z",
    actualDeliveryDate: "2025-04-22T07:45:00Z",
    status: "DELIVERED",
    notes: "",
    address: "12 Rue de la Paix, Paris",
  },
  {
    id: "6",
    orderId: "6",
    orderReferenceId: "CMD-2025-006",
    bakeryName: "Boulangerie Montmartre",
    deliveryUserId: "7",
    deliveryUserName: "Marie Lambert",
    scheduledDate: "2025-04-21T08:00:00Z",
    actualDeliveryDate: null,
    status: "FAILED",
    notes: "Boulangerie fermée",
    address: "45 Avenue des Champs-Élysées, Paris",
  },
]

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingDelivery, setViewingDelivery] = useState<Delivery | null>(null)
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false)
  const [deliveryToUpdate, setDeliveryToUpdate] = useState<Delivery | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // Filter deliveries based on search term and status
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryUserName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && delivery.status === "PENDING") ||
      (activeTab === "in_transit" && delivery.status === "IN_TRANSIT") ||
      (activeTab === "delivered" && delivery.status === "DELIVERED") ||
      (activeTab === "failed" && delivery.status === "FAILED")

    return matchesSearch && matchesStatus && matchesTab
  })

  // Handle status update
  const handleUpdateStatus = () => {
    if (!deliveryToUpdate || !newStatus) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un statut",
        variant: "destructive",
      })
      return
    }

    // Update delivery status
    const updatedDeliveries = deliveries.map((delivery) =>
      delivery.id === deliveryToUpdate.id
        ? {
            ...delivery,
            status: newStatus as "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED",
            actualDeliveryDate: newStatus === "DELIVERED" ? new Date().toISOString() : delivery.actualDeliveryDate,
          }
        : delivery,
    )
    setDeliveries(updatedDeliveries)
    setIsUpdateStatusDialogOpen(false)
    setDeliveryToUpdate(null)
    setNewStatus("")
    toast({
      title: "Statut mis à jour",
      description: `Le statut de la livraison a été mis à jour avec succès`,
    })
  }

  // Format date
  const formatDate = (dateString: string | null) => {
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
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            En attente
          </Badge>
        )
      case "IN_TRANSIT":
        return <Badge variant="secondary">En transit</Badge>
      case "DELIVERED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Livré
          </Badge>
        )
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Échoué
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Livraisons</h1>
            <p className="text-muted-foreground">Gérez et suivez toutes les livraisons</p>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="in_transit">En transit</TabsTrigger>
            <TabsTrigger value="delivered">Livrées</TabsTrigger>
            <TabsTrigger value="failed">Échouées</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Liste des livraisons</CardTitle>
                <CardDescription>{filteredDeliveries.length} livraisons trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une livraison..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                        <SelectItem value="DELIVERED">Livré</SelectItem>
                        <SelectItem value="FAILED">Échoué</SelectItem>
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
                        <TableHead>Livreur</TableHead>
                        <TableHead>Date prévue</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Aucune livraison trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">{delivery.orderReferenceId}</TableCell>
                            <TableCell>{delivery.bakeryName}</TableCell>
                            <TableCell>{delivery.deliveryUserName}</TableCell>
                            <TableCell>{formatDate(delivery.scheduledDate)}</TableCell>
                            <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog
                                  open={isViewDialogOpen && viewingDelivery?.id === delivery.id}
                                  onOpenChange={(open) => {
                                    setIsViewDialogOpen(open)
                                    if (open) setViewingDelivery(delivery)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Voir</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Détails de la livraison</DialogTitle>
                                    </DialogHeader>
                                    {viewingDelivery && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <h3 className="font-medium">Informations générales</h3>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Référence:</span>
                                                <span>{viewingDelivery.orderReferenceId}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Boulangerie:</span>
                                                <span>{viewingDelivery.bakeryName}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Livreur:</span>
                                                <span>{viewingDelivery.deliveryUserName}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Statut:</span>
                                                <span>{getStatusBadge(viewingDelivery.status)}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">Dates</h3>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date prévue:</span>
                                                <span>{formatDate(viewingDelivery.scheduledDate)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date effective:</span>
                                                <span>
                                                  {viewingDelivery.actualDeliveryDate
                                                    ? formatDate(viewingDelivery.actualDeliveryDate)
                                                    : "Non livrée"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Adresse de livraison</h3>
                                          <p className="mt-2 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {viewingDelivery.address}
                                          </p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Notes</h3>
                                          <p className="mt-2 text-sm">{viewingDelivery.notes || "Aucune note"}</p>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Dialog
                                  open={isUpdateStatusDialogOpen && deliveryToUpdate?.id === delivery.id}
                                  onOpenChange={(open) => {
                                    setIsUpdateStatusDialogOpen(open)
                                    if (open) {
                                      setDeliveryToUpdate(delivery)
                                      setNewStatus(delivery.status)
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
                                        Modifiez le statut de la livraison {delivery.orderReferenceId}
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
                                            <SelectItem value="PENDING">En attente</SelectItem>
                                            <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                                            <SelectItem value="DELIVERED">Livré</SelectItem>
                                            <SelectItem value="FAILED">Échoué</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      {newStatus === "FAILED" && (
                                        <div className="grid gap-2">
                                          <Label htmlFor="failure-reason">Raison de l'échec</Label>
                                          <Textarea
                                            id="failure-reason"
                                            placeholder="Expliquez pourquoi la livraison a échoué..."
                                          />
                                        </div>
                                      )}
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

          {/* Other tabs will show the same content but filtered by status */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Livraisons en attente</CardTitle>
                <CardDescription>{filteredDeliveries.length} livraisons trouvées</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Same table content as above */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Boulangerie</TableHead>
                        <TableHead>Livreur</TableHead>
                        <TableHead>Date prévue</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Aucune livraison en attente
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">{delivery.orderReferenceId}</TableCell>
                            <TableCell>{delivery.bakeryName}</TableCell>
                            <TableCell>{delivery.deliveryUserName}</TableCell>
                            <TableCell>{formatDate(delivery.scheduledDate)}</TableCell>
                            <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setViewingDelivery(delivery)
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

          {/* Similar content for other tabs */}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
