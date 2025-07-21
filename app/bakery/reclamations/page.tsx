"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  RefreshCw, 
  AlertTriangle,
  Package,
  Plus,
  Trash2
} from "lucide-react"
import { reportConflict, type Discrepancy } from "@/lib/api/conflicts"

// Types
interface Order {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  status: string
  address: string
  products: Array<{
    productName: string
    quantity: number
    unitPriceTTC: number
    totalPriceTTC: number
  }>
  orderTotalTTC: number
  hasConflict: boolean
  conflictStatus: string
  createdAt: string
}

export default function BakeryReclamationPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [conflictDescription, setConflictDescription] = useState("")
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const { toast } = useToast()

  // Fetch orders for the bakery
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const userInfo = localStorage.getItem('userInfo')
      const token = userInfo ? JSON.parse(userInfo).token : null
      
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("http://localhost:5000/orders", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const ordersData = await response.json()
      // Filter orders for delivered status where conflicts can be reported
      const deliveredOrders = ordersData.filter((order: Order) => 
        order.status === 'DELIVERED' || order.status === 'COMPLETED'
      )
      setOrders(deliveredOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les commandes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a new discrepancy
  const addDiscrepancy = () => {
    if (!selectedOrder) return
    
    const newDiscrepancy: Discrepancy = {
      productName: selectedOrder.products[0]?.productName || '',
      ordered: {
        quantity: selectedOrder.products[0]?.quantity || 0,
        unitPrice: selectedOrder.products[0]?.unitPriceTTC || 0,
        totalPrice: selectedOrder.products[0]?.totalPriceTTC || 0
      },
      received: {
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        condition: ''
      },
      issueType: 'QUANTITY_MISMATCH',
      notes: ''
    }
    
    setDiscrepancies([...discrepancies, newDiscrepancy])
  }

  // Remove a discrepancy
  const removeDiscrepancy = (index: number) => {
    setDiscrepancies(discrepancies.filter((_, i) => i !== index))
  }

  // Update a discrepancy
  const updateDiscrepancy = (index: number, updates: Partial<Discrepancy>) => {
    const updated = discrepancies.map((disc, i) => 
      i === index ? { ...disc, ...updates } : disc
    )
    setDiscrepancies(updated)
  }

  // Handle conflict report submission
  const handleReportConflict = async () => {
    if (!selectedOrder || !conflictDescription || discrepancies.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setIsReporting(true)
    try {
      const userInfo = localStorage.getItem('userInfo')
      const token = userInfo ? JSON.parse(userInfo).token : null
      
      if (!token) {
        throw new Error("Authentication required")
      }

      const bakeryInfo = JSON.parse(userInfo!)
      
      await reportConflict(selectedOrder._id, {
        reportedBy: selectedOrder.bakeryName,
        description: conflictDescription,
        discrepancies
      }, token)

      toast({
        title: "Réclamation signalée",
        description: "Votre réclamation a été transmise à l'administration",
      })

      // Reset form and refresh orders
      setSelectedOrder(null)
      setConflictDescription("")
      setDiscrepancies([])
      fetchOrders()
    } catch (error) {
      console.error("Error reporting conflict:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de signaler la réclamation",
        variant: "destructive",
      })
    } finally {
      setIsReporting(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="bakery">
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
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Signaler un Problème de Livraison</h1>
            <p className="text-muted-foreground">
              Signalez les écarts entre ce que vous avez commandé et ce que vous avez reçu
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchOrders} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes Livrées</CardTitle>
            <CardDescription>
              Sélectionnez une commande pour signaler un problème
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date de livraison</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucune commande livrée trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {order.orderReferenceId}
                        </TableCell>
                        <TableCell>
                          {new Date(order.scheduledDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {order.deliveryUserName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.hasConflict ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Conflit signalé
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {order.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.orderTotalTTC?.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          {!order.hasConflict && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setDiscrepancies([])
                                    setConflictDescription("")
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Signaler un problème
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Signaler un Problème - Commande {order.orderReferenceId}</DialogTitle>
                                  <DialogDescription>
                                    Décrivez les écarts entre ce que vous avez commandé et ce que vous avez reçu
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* General Description */}
                                  <div>
                                    <label className="text-sm font-medium">Description générale du problème *</label>
                                    <Textarea
                                      className="mt-1"
                                      placeholder="Décrivez le problème rencontré avec cette livraison..."
                                      value={conflictDescription}
                                      onChange={(e) => setConflictDescription(e.target.value)}
                                    />
                                  </div>

                                  {/* Discrepancies */}
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium">Détails des écarts</h4>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDiscrepancy}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Ajouter un écart
                                      </Button>
                                    </div>

                                    <div className="space-y-4 mt-4">
                                      {discrepancies.map((disc, index) => (
                                        <div key={index} className="border rounded p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium">Écart #{index + 1}</h5>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeDiscrepancy(index)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium">Produit</label>
                                              <Select
                                                value={disc.productName}
                                                onValueChange={(value) => updateDiscrepancy(index, { productName: value })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {selectedOrder?.products.map((product, i) => (
                                                    <SelectItem key={i} value={product.productName}>
                                                      {product.productName}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div>
                                              <label className="text-sm font-medium">Type de problème</label>
                                              <Select
                                                value={disc.issueType}
                                                onValueChange={(value) => updateDiscrepancy(index, { issueType: value as any })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="QUANTITY_MISMATCH">Quantité incorrecte</SelectItem>
                                                  <SelectItem value="QUALITY_ISSUE">Problème de qualité</SelectItem>
                                                  <SelectItem value="WRONG_PRODUCT">Mauvais produit</SelectItem>
                                                  <SelectItem value="DAMAGED">Produit endommagé</SelectItem>
                                                  <SelectItem value="EXPIRED">Produit expiré</SelectItem>
                                                  <SelectItem value="MISSING">Produit manquant</SelectItem>
                                                  <SelectItem value="OTHER">Autre</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div>
                                              <label className="text-sm font-medium">Quantité commandée</label>
                                              <Input
                                                type="number"
                                                value={disc.ordered.quantity}
                                                onChange={(e) => updateDiscrepancy(index, {
                                                  ordered: { ...disc.ordered, quantity: parseInt(e.target.value) || 0 }
                                                })}
                                              />
                                            </div>

                                            <div>
                                              <label className="text-sm font-medium">Quantité reçue</label>
                                              <Input
                                                type="number"
                                                value={disc.received.quantity}
                                                onChange={(e) => updateDiscrepancy(index, {
                                                  received: { ...disc.received, quantity: parseInt(e.target.value) || 0 }
                                                })}
                                              />
                                            </div>

                                            <div className="md:col-span-2">
                                              <label className="text-sm font-medium">État du produit reçu</label>
                                              <Input
                                                placeholder="ex: endommagé, expiré, différent..."
                                                value={disc.received.condition || ''}
                                                onChange={(e) => updateDiscrepancy(index, {
                                                  received: { ...disc.received, condition: e.target.value }
                                                })}
                                              />
                                            </div>

                                            <div className="md:col-span-2">
                                              <label className="text-sm font-medium">Notes supplémentaires</label>
                                              <Textarea
                                                placeholder="Détails supplémentaires sur ce problème..."
                                                value={disc.notes || ''}
                                                onChange={(e) => updateDiscrepancy(index, { notes: e.target.value })}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      {discrepancies.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                          Cliquez sur "Ajouter un écart" pour signaler les problèmes rencontrés
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button
                                    onClick={handleReportConflict}
                                    disabled={!conflictDescription || discrepancies.length === 0 || isReporting}
                                  >
                                    {isReporting ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Envoi...
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Signaler le problème
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {order.hasConflict && (
                            <Badge variant="outline">
                              Déjà signalé
                            </Badge>
                          )}
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
