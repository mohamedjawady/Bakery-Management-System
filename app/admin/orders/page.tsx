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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Eye, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  customerName: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELIVERED" | "CANCELLED"
  items: OrderItem[]
  total: number
  createdAt: string
  deliveryDate: string
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Marie Dupont",
    status: "PENDING",
    items: [
      {
        productId: "1",
        productName: "Baguette Tradition",
        quantity: 2,
        unitPrice: 1.2,
      },
      {
        productId: "2",
        productName: "Pain au Chocolat",
        quantity: 4,
        unitPrice: 1.5,
      },
    ],
    total: 8.4,
    createdAt: "2024-01-20T08:30:00Z",
    deliveryDate: "2024-01-21T10:00:00Z",
  },
  {
    id: "ORD-002",
    customerName: "Jean Martin",
    status: "IN_PROGRESS",
    items: [
      {
        productId: "3",
        productName: "Croissant",
        quantity: 6,
        unitPrice: 1.3,
      },
    ],
    total: 7.8,
    createdAt: "2024-01-20T09:15:00Z",
    deliveryDate: "2024-01-21T11:00:00Z",
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const { toast } = useToast()

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    const variant = variants[status]
    return (
      <Badge variant="outline" className={`${variant.bg} ${variant.text} ${variant.border}`}>
        {variant.label}
      </Badge>
    )
  }

  // Handle status update
  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    toast({
      title: "Statut mis à jour",
      description: `La commande ${orderId} a été mise à jour avec succès`,
    })
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
            <CardDescription>{filteredOrders.length} commandes trouvées</CardDescription>
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
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
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
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails de la commande {order.id}</DialogTitle>
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
                                      <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-medium mb-2">Articles</h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Produit</TableHead>
                                          <TableHead className="text-right">Quantité</TableHead>
                                          <TableHead className="text-right">Prix unitaire</TableHead>
                                          <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {viewingOrder.items.map((item) => (
                                          <TableRow key={item.productId}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                              {formatPrice(item.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatPrice(item.quantity * item.unitPrice)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow>
                                          <TableCell colSpan={3} className="text-right font-medium">
                                            Total
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatPrice(viewingOrder.total)}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
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
