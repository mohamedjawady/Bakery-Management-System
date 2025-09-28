"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Eye, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  customerName: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELIVERED" | "CANCELLED"
  items: OrderItem[]
  total: number
  totalHT: number
  totalTTC: number
  createdAt: string
  deliveryDate: string
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  unitPriceHT: number
  unitPriceTTC: number
  totalPrice: number
  totalPriceHT: number
  totalPriceTTC: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/orders")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
console.log(data);

        // Validate and sanitize the data
        const validatedOrders = data.map((order: any) => {
  const items = Array.isArray(order.products) ? order.products.map((item: any) => ({
    productId: item.productId || item._id || 'unknown',
    productName: item.productName || 'Produit inconnu',
    quantity: item.quantity || 0,
    unitPrice: item.unitPriceTTC || 0, // Map unitPriceTTC to unitPrice for backward compatibility
    unitPriceHT: item.unitPriceHT || 0,
    unitPriceTTC: item.unitPriceTTC || 0,
    totalPrice: item.totalPrice || 0,
    totalPriceHT: item.totalPriceHT || 0,
    totalPriceTTC: item.totalPriceTTC || 0
  })) : [];
  
  const total = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  const totalHT = items.reduce((sum: number, item: any) => sum + (item.totalPriceHT || 0), 0);
  const totalTTC = items.reduce((sum: number, item: any) => sum + (item.totalPriceTTC || 0), 0);

  // Normalize status to match expected values
  let normalizedStatus = order.status || "PENDING";
  const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(normalizedStatus)) {
    normalizedStatus = "PENDING";
  }

  return {
    id: order._id?.toString() || `unknown-${Math.random().toString(36).substr(2, 9)}`,
    customerName: order.bakeryName?.toString() || "Client inconnu",
    status: normalizedStatus as Order["status"],
    orderReferenceId:order.orderReferenceId,
    items,
    total,
    totalHT,
    totalTTC,
    createdAt: order.createdAt || new Date().toISOString(),
    deliveryDate: order.deliveryDate || new Date().toISOString(),
  };
});

console.log(validatedOrders);

        setOrders(validatedOrders)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        setError("Impossible de charger les commandes. Veuillez réessayer plus tard.")
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les commandes depuis le serveur",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  // Replace the filter function with this safer version that includes null checks
  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true

    const idMatch = order?.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || false
    const nameMatch = order?.customerName?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || false

    return idMatch || nameMatch
  })
console.log('filteredOrders',filteredOrders);

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

  // Get status badge variant
  const getStatusBadge = (status: Order["status"]) => {
    const variants = {
      PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "En attente" },
      IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "En cours" },
      COMPLETED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Terminé" },
      DELIVERED: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Livré" },
      CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Annulé" },
    }
    const variant = variants[status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: status || "Inconnu" }
    return (
      <Badge variant="outline" className={` ${variant.text} ${variant.border}`}>
        {variant.label}
      </Badge>
    )
  }

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      setOrders(updatedOrders)

      toast({
        title: "Statut mis à jour",
        description: `La commande ${orderId} a été mise à jour avec succès`,
      })
    } catch (err) {
      console.error("Failed to update order status:", err)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande",
      })
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">Gérez les commandes des clients</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des commandes</CardTitle>
            <CardDescription>
              {isLoading ? "Chargement..." : `${filteredOrders.length} commandes trouvées`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-4 mb-4 text-red-700 border border-red-200">{error}</div>}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Livraison prévue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Chargement des commandes...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderReferenceId}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusUpdate(order.id, value as Order["status"])}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">En attente</SelectItem>
                                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                                <SelectItem value="COMPLETED">Terminé</SelectItem>
                                <SelectItem value="DELIVERED">Livré</SelectItem>
                                <SelectItem value="CANCELLED">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                        <TableCell className="text-right">
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
                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle >Détails de la commande {order.id}</DialogTitle>
                              </DialogHeader>
                              {viewingOrder && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-medium">Client</h3>
                                      <p>{viewingOrder.customerName}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Statut</h3>
                                      <div className="mt-1">{viewingOrder.status}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-medium mb-2">Articles</h3>
                                    <div className="overflow-x-auto">
                                      <Table className="min-w-full">
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="min-w-[200px]">Produit</TableHead>
                                            <TableHead className="text-right min-w-[80px]">Quantité</TableHead>
                                            <TableHead className="text-right min-w-[120px]">Prix unitaire HT</TableHead>
                                            <TableHead className="text-right min-w-[120px]">Prix unitaire TTC</TableHead>
                                            <TableHead className="text-right min-w-[100px]">Total HT</TableHead>
                                            <TableHead className="text-right min-w-[100px]">Total TTC</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                      <TableBody>
                                        {viewingOrder.items.map((item) => (
                                          <TableRow key={item.productId}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatPrice(item.unitPriceHT)}</TableCell>
                                            <TableCell className="text-right">{formatPrice(item.unitPriceTTC)}</TableCell>
                                            <TableCell className="text-right">
                                              {formatPrice(item.totalPriceHT)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatPrice(item.totalPriceTTC)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-right font-medium">
                                            Total HT
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatPrice(viewingOrder.totalHT)}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            -
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-right font-medium">
                                            TVA
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatPrice(viewingOrder.totalTTC - viewingOrder.totalHT)}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            -
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-right font-medium">
                                            Total TTC
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            -
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatPrice(viewingOrder.totalTTC)}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-medium">Date de création</h3>
                                      <p>{formatDate(viewingOrder.createdAt)}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Date de livraison prévue</h3>
                                      <p>{formatDate(viewingOrder.deliveryDate)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
