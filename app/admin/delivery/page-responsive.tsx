"use client"

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, Filter, MapPin, Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define delivery type
interface Delivery {
  id: string;
  orderId: string;
  orderReferenceId: string;
  bakeryName: string;
  deliveryUserId: string;
  deliveryUserName: string;
  scheduledDate: string;
  actualDeliveryDate: string | null;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  notes: string;
  address: string;
}

// This component provides enhanced mobile support for the DeliveryPage
export default function DeliveryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState<Delivery | null>(null);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [deliveryToUpdate, setDeliveryToUpdate] = useState<Delivery | null>(null);
  const [newStatus, setNewStatus] = useState("");
  
  // Get sample data from the original file
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filter deliveries based on search term and status
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryUserName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && delivery.status === "PENDING") ||
      (activeTab === "in_transit" && delivery.status === "IN_TRANSIT") ||
      (activeTab === "delivered" && delivery.status === "DELIVERED") ||
      (activeTab === "failed" && delivery.status === "FAILED");

    return matchesSearch && matchesStatus && matchesTab;
  });

  // Handle status update
  const handleUpdateStatus = () => {
    if (!deliveryToUpdate || !newStatus) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un statut",
        variant: "destructive",
      });
      return;
    }

    // Update delivery status
    const updatedDeliveries = deliveries.map((delivery) =>
      delivery.id === deliveryToUpdate.id
        ? {
            ...delivery,
            status: newStatus as "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED",
            actualDeliveryDate: newStatus === "DELIVERED" ? new Date().toISOString() : delivery.actualDeliveryDate,
          }
        : delivery
    );
    
    setDeliveries(updatedDeliveries);
    setIsUpdateStatusDialogOpen(false);
    setDeliveryToUpdate(null);
    setNewStatus("");
    
    toast({
      title: "Statut mis à jour",
      description: `Le statut de la livraison a été mis à jour avec succès`,
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="delivery-status delivery-status-pending">En attente</span>;
      case "IN_TRANSIT":
        return <span className="delivery-status delivery-status-transit">En transit</span>;
      case "DELIVERED":
        return <span className="delivery-status delivery-status-delivered">Livré</span>;
      case "FAILED":
        return <span className="delivery-status delivery-status-failed">Échoué</span>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Livraisons</h1>
            <p className="text-muted-foreground">Gérez et suivez toutes les livraisons</p>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="delivery-tabs-list flex w-full overflow-x-auto md:grid md:grid-cols-5">
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
                <div className="delivery-filters mb-4">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une livraison..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
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
                        <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                        <SelectItem value="DELIVERED">Livré</SelectItem>
                        <SelectItem value="FAILED">Échoué</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mobile-friendly layout for smaller screens */}
                <div className="md:hidden space-y-3">
                  {filteredDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune livraison trouvée
                    </div>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <Card key={delivery.id} className="overflow-hidden">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">{delivery.orderReferenceId}</div>
                            <div>{getStatusBadge(delivery.status)}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <div className="delivery-info-label">Boulangerie:</div>
                            <div className="delivery-info-value">{delivery.bakeryName}</div>
                            
                            <div className="delivery-info-label">Livreur:</div>
                            <div className="delivery-info-value">{delivery.deliveryUserName}</div>
                            
                            <div className="delivery-info-label">Date prévue:</div>
                            <div className="delivery-info-value">{formatDate(delivery.scheduledDate)}</div>
                          </div>
                          
                          <div className="delivery-action-buttons border-t pt-2 flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => {
                                setViewingDelivery(delivery);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Détails</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => {
                                setDeliveryToUpdate(delivery);
                                setNewStatus(delivery.status);
                                setIsUpdateStatusDialogOpen(true);
                              }}
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Statut</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                {/* Desktop table layout */}
                <div className="rounded-md border responsive-table-container hidden md:block">
                  <Table className="responsive-table">
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
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="table-action-button"
                                  onClick={() => {
                                    setViewingDelivery(delivery);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="table-action-button"
                                  onClick={() => {
                                    setDeliveryToUpdate(delivery);
                                    setNewStatus(delivery.status);
                                    setIsUpdateStatusDialogOpen(true);
                                  }}
                                >
                                  <Truck className="h-4 w-4" />
                                  <span className="sr-only">Mettre à jour</span>
                                </Button>
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

          {/* Other tabs with the same content structure */}
        </Tabs>
        
        {/* View delivery dialog */}
        {viewingDelivery && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Détails de la livraison</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Informations générales</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Référence:</span>
                        <span className="font-medium">{viewingDelivery.orderReferenceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Boulangerie:</span>
                        <span className="font-medium">{viewingDelivery.bakeryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Livreur:</span>
                        <span className="font-medium">{viewingDelivery.deliveryUserName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut:</span>
                        <span>{getStatusBadge(viewingDelivery.status)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Dates</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date prévue:</span>
                        <span className="font-medium">{formatDate(viewingDelivery.scheduledDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date effective:</span>
                        <span className="font-medium">
                          {viewingDelivery.actualDeliveryDate
                            ? formatDate(viewingDelivery.actualDeliveryDate)
                            : "Non livrée"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Adresse de livraison</h3>
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{viewingDelivery.address}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-sm">{viewingDelivery.notes || "Aucune note"}</p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Update status dialog */}
        {deliveryToUpdate && (
          <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Mettre à jour le statut</DialogTitle>
                <DialogDescription>
                  Modifiez le statut de la livraison {deliveryToUpdate.orderReferenceId}
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
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateStatus}>Mettre à jour</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Sample data copied from the original component
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
];
