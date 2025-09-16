"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, CheckCircle, Search, Eye, Package } from "lucide-react"
import { getConflictOrders, resolveConflict, type ConflictResolution } from "@/lib/api/conflicts"

// Types
interface Product {
  productName: string
  productRef?: string
  laboratory: string
  unitPriceHT: number
  unitPriceTTC: number
  taxRate: number
  quantity: number
  totalPriceHT: number
  taxAmount: number
  totalPriceTTC: number
  totalPrice: number
}

interface Discrepancy {
  productName: string
  ordered: {
    quantity: number
    unitPrice?: number
    totalPrice?: number
  }
  received: {
    quantity: number
    unitPrice?: number
    totalPrice?: number
    condition?: string
  }
  issueType: "QUANTITY_MISMATCH" | "QUALITY_ISSUE" | "WRONG_PRODUCT" | "DAMAGED" | "EXPIRED" | "MISSING" | "OTHER"
  notes?: string
}

interface Reclamation {
  reportedBy: string
  reportedAt: string
  description: string
  discrepancies: Discrepancy[]
  reviewedBy?: string
  reviewedAt?: string
  adminNotes?: string
  resolution?: "ACCEPT_AS_IS" | "PARTIAL_REFUND" | "FULL_REFUND" | "REPLACE_ORDER" | "UPDATE_ORDER" | "REJECT"
  correctedProducts?: Product[]
  correctedTotalHT?: number
  correctedTaxAmount?: number
  correctedTotalTTC?: number
}

interface ConflictOrder {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate?: string
  status: string
  address: string
  products: Product[]
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  hasConflict: boolean
  conflictStatus: "NONE" | "REPORTED" | "UNDER_REVIEW" | "RESOLVED" | false
  reclamation: Reclamation
  createdAt: string
}

export default function ConflictResolutionPage() {
  const [conflictOrders, setConflictOrders] = useState<ConflictOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ConflictOrder | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [resolutionData, setResolutionData] = useState<Partial<ConflictResolution>>({})
  const [correctedProducts, setCorrectedProducts] = useState<Product[]>([])
  const { toast } = useToast()

  // Fetch conflict orders
  const fetchConflictOrders = async () => {
    setLoading(true)
    try {
      // Mock authentication data for preview
      const userInfo = localStorage.getItem("userInfo")
      let token = userInfo ? JSON.parse(userInfo).token : null

      if (!token) {
        const mockUserInfo = {
          token: "mock-admin-token",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        }
        localStorage.setItem("userInfo", JSON.stringify(mockUserInfo))
        token = mockUserInfo.token
      }

      const orders = await getConflictOrders(token)
      setConflictOrders(orders)
    } catch (error) {
      console.error("Error fetching conflict orders:", error)
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les conflits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle conflict resolution
  const handleResolveConflict = async () => {
    if (!selectedOrder || !resolutionData.resolution) return

    setIsResolving(true)
    try {
      // Mock authentication data for preview
      let userInfo = localStorage.getItem("userInfo")
      let token = userInfo ? JSON.parse(userInfo).token : null

      if (!token) {
        const mockUserInfo = {
          token: "mock-admin-token",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        }
        localStorage.setItem("userInfo", JSON.stringify(mockUserInfo))
        token = mockUserInfo.token
        userInfo = JSON.stringify(mockUserInfo)
      }

      const adminInfo = JSON.parse(userInfo!)
      const resolution: ConflictResolution = {
        reviewedBy: `${adminInfo.firstName} ${adminInfo.lastName}`,
        adminNotes: resolutionData.adminNotes || "",
        resolution: resolutionData.resolution,
        ...(resolutionData.resolution === "UPDATE_ORDER" && {
          correctedProducts: resolutionData.correctedProducts,
          correctedTotalHT: resolutionData.correctedTotalHT,
          correctedTaxAmount: resolutionData.correctedTaxAmount,
          correctedTotalTTC: resolutionData.correctedTotalTTC,
        }),
      }

      await resolveConflict(selectedOrder._id, resolution, token)

      // Update the local state immediately to reflect the change
      setConflictOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === selectedOrder._id ? { ...order, hasConflict: false, conflictStatus: false } : order,
        ),
      )

      toast({
        title: "Conflit résolu",
        description:
          resolutionData.resolution === "UPDATE_ORDER"
            ? "Le conflit a été résolu et la commande originale a été mise à jour"
            : resolutionData.resolution === "REJECT"
              ? "Le conflit a été rejeté et marqué comme résolu"
              : "Le conflit a été résolu avec succès",
      })

      // Refresh the list
      fetchConflictOrders()
      setSelectedOrder(null)
      setResolutionData({})
      setCorrectedProducts([])
    } catch (error) {
      console.error("Error resolving conflict:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de résoudre le conflit",
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  // Filter orders based on search
  const filteredOrders = conflictOrders.filter(
    (order) =>
      order.orderReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reclamation?.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get conflict stats
  const getConflictStats = () => {
    const reported = conflictOrders.filter((o) => o.conflictStatus === "REPORTED").length
    const underReview = conflictOrders.filter((o) => o.conflictStatus === "UNDER_REVIEW").length
    const resolved = conflictOrders.filter((o) => o.conflictStatus === "RESOLVED" || o.conflictStatus === false).length
    return { reported, underReview, resolved, total: conflictOrders.length }
  }

  const getStatusBadge = (status: string | false) => {
    switch (status) {
      case "REPORTED":
        return <Badge variant="destructive">Signalé</Badge>
      case "UNDER_REVIEW":
        return (
          <Badge variant="outline" className="border-orange-400 text-orange-600">
            En cours
          </Badge>
        )
      case "RESOLVED":
      case false:
        return (
          <Badge variant="outline" className="border-green-400 text-green-600">
            Résolu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getIssueTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      QUANTITY_MISMATCH: { label: "Quantité", color: "bg-blue-100 text-blue-800" },
      QUALITY_ISSUE: { label: "Qualité", color: "bg-red-100 text-red-800" },
      WRONG_PRODUCT: { label: "Mauvais produit", color: "bg-purple-100 text-purple-800" },
      DAMAGED: { label: "Endommagé", color: "bg-orange-100 text-orange-800" },
      EXPIRED: { label: "Expiré", color: "bg-yellow-100 text-yellow-800" },
      MISSING: { label: "Manquant", color: "bg-gray-100 text-gray-800" },
      OTHER: { label: "Autre", color: "bg-gray-100 text-gray-800" },
    }
    const typeInfo = types[type] || types["OTHER"]
    return <span className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
  }

  const initializeCorrectedProducts = (order: ConflictOrder) => {
    const corrected = order.products.map((product) => ({ ...product }))
    setCorrectedProducts(corrected)

    // Calculate initial totals
    const correctedTotalHT = corrected.reduce((sum, p) => sum + p.totalPriceHT, 0)
    const correctedTaxAmount = corrected.reduce((sum, p) => sum + p.taxAmount, 0)
    const correctedTotalTTC = correctedTotalHT + correctedTaxAmount

    setResolutionData({
      ...resolutionData,
      resolution: "UPDATE_ORDER",
      correctedProducts: corrected,
      correctedTotalHT,
      correctedTaxAmount,
      correctedTotalTTC,
    })
  }

  const updateProductQuantity = (index: number, newQuantity: number) => {
    const updated = correctedProducts.map((product, i) => {
      if (i === index) {
        const updatedProduct = { ...product, quantity: newQuantity }
        updatedProduct.totalPriceHT = updatedProduct.unitPriceHT * newQuantity
        updatedProduct.taxAmount = updatedProduct.totalPriceHT * (updatedProduct.taxRate / 100)
        updatedProduct.totalPriceTTC = updatedProduct.totalPriceHT + updatedProduct.taxAmount
        updatedProduct.totalPrice = updatedProduct.totalPriceTTC
        return updatedProduct
      }
      return product
    })

    setCorrectedProducts(updated)

    const correctedTotalHT = updated.reduce((sum, p) => sum + p.totalPriceHT, 0)
    const correctedTaxAmount = updated.reduce((sum, p) => sum + p.taxAmount, 0)
    const correctedTotalTTC = correctedTotalHT + correctedTaxAmount

    setResolutionData({
      ...resolutionData,
      correctedProducts: updated,
      correctedTotalHT,
      correctedTaxAmount,
      correctedTotalTTC,
    })
  }

  useEffect(() => {
    fetchConflictOrders()
  }, [])

  const conflictStats = getConflictStats()

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement des conflits...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Conflits de Livraison</h1>
            <p className="text-muted-foreground">
              Résolvez les réclamations des boulangeries concernant les commandes livrées
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchConflictOrders} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Conflits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conflictStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Signalements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{conflictStats.reported}</div>
              <p className="text-xs text-muted-foreground">Nécessitent votre attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Cours de Traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{conflictStats.underReview}</div>
              <p className="text-xs text-muted-foreground">En cours d'examen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{conflictStats.resolved}</div>
              <p className="text-xs text-muted-foreground">Traités avec succès</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Conflits Signalés</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence, boulangerie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Boulangerie</TableHead>
                    <TableHead>Signalé le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Problèmes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {conflictOrders.length === 0 ? "Aucun conflit signalé" : "Aucun résultat trouvé"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{order.orderReferenceId}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.scheduledDate).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {order.bakeryName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.reclamation.reportedAt).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-xs text-muted-foreground">par {order.reclamation.reportedBy}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.conflictStatus)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {order.reclamation.discrepancies?.slice(0, 2).map((disc, idx) => (
                              <div key={idx}>{getIssueTypeBadge(disc.issueType)}</div>
                            ))}
                            {order.reclamation.discrepancies?.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{order.reclamation.discrepancies.length - 2} autres
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setResolutionData({})
                                  setCorrectedProducts([])
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Examiner
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Conflit - Commande {order.orderReferenceId}</DialogTitle>
                                <DialogDescription>
                                  Réclamation de {order.bakeryName} signalée le{" "}
                                  {new Date(order.reclamation.reportedAt).toLocaleDateString("fr-FR")}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Description du problème */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Description du problème</h4>
                                    <p className="text-sm bg-muted p-3 rounded">
                                      {selectedOrder.reclamation.description}
                                    </p>
                                  </div>

                                  {/* Discrepancies */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Détails des écarts</h4>
                                    <div className="space-y-3">
                                      {selectedOrder.reclamation.discrepancies?.map((disc, idx) => (
                                        <div key={idx} className="border rounded p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{disc.productName}</span>
                                            {getIssueTypeBadge(disc.issueType)}
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Commandé:</span>
                                              <div>{disc.ordered.quantity} unités</div>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Reçu:</span>
                                              <div>{disc.received.quantity} unités</div>
                                              {disc.received.condition && (
                                                <div className="text-xs text-muted-foreground">
                                                  État: {disc.received.condition}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {disc.notes && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                              Notes: {disc.notes}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Resolution form */}
                                  {selectedOrder.conflictStatus !== "RESOLVED" &&
                                    selectedOrder.conflictStatus !== false && (
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-medium">Résolution</h4>

                                        <div>
                                          <label className="text-sm font-medium">Type de résolution</label>
                                          <Select
                                            value={resolutionData.resolution}
                                            onValueChange={(value) => {
                                              setResolutionData({ ...resolutionData, resolution: value as any })
                                              if (value === "UPDATE_ORDER" && selectedOrder) {
                                                initializeCorrectedProducts(selectedOrder)
                                              } else {
                                                setCorrectedProducts([])
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="mt-1">
                                              <SelectValue placeholder="Choisir une résolution" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="REPLACE_ORDER">Remplacer la commande</SelectItem>
                                              <SelectItem value="UPDATE_ORDER">Corriger la quantité</SelectItem>
                                              <SelectItem value="REJECT">Rejeter</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Quantity correction form */}
                                        {resolutionData.resolution === "UPDATE_ORDER" &&
                                          correctedProducts.length > 0 && (
                                            <div className="space-y-4">
                                              <h5 className="text-sm font-medium">Correction des quantités</h5>
                                              <div className="border rounded-lg p-4 space-y-4">
                                                {correctedProducts.map((product, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-muted rounded"
                                                  >
                                                    <div className="flex-1">
                                                      <div className="font-medium">{product.productName}</div>
                                                      <div className="text-sm text-muted-foreground">
                                                        Prix unitaire: {product.unitPriceTTC.toFixed(2)} € TTC
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                      <div className="text-sm text-muted-foreground">
                                                        Quantité originale:{" "}
                                                        {selectedOrder?.products[index]?.quantity || 0}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <label className="text-sm font-medium">
                                                          Nouvelle quantité:
                                                        </label>
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          value={product.quantity}
                                                          onChange={(e) =>
                                                            updateProductQuantity(index, Number(e.target.value) || 0)
                                                          }
                                                          className="w-20"
                                                        />
                                                      </div>
                                                      <div className="text-sm font-medium">
                                                        Total: {product.totalPriceTTC.toFixed(2)} € TTC
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}

                                                {/* Totals */}
                                                <div className="border-t pt-4 mt-4">
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-medium">Total original:</span>
                                                    <span>{selectedOrder?.orderTotalTTC.toFixed(2)} € TTC</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-lg font-bold">
                                                    <span>Nouveau total:</span>
                                                    <span className="text-primary">
                                                      {resolutionData.correctedTotalTTC?.toFixed(2)} € TTC
                                                    </span>
                                                  </div>
                                                  {resolutionData.correctedTotalTTC !==
                                                    selectedOrder?.orderTotalTTC && (
                                                    <div className="flex justify-between items-center text-sm">
                                                      <span>Différence:</span>
                                                      <span
                                                        className={
                                                          (resolutionData.correctedTotalTTC || 0) >
                                                          selectedOrder!.orderTotalTTC
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                        }
                                                      >
                                                        {(
                                                          (resolutionData.correctedTotalTTC || 0) -
                                                          selectedOrder!.orderTotalTTC
                                                        ).toFixed(2)}{" "}
                                                        € TTC
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                        {/* Notes */}
                                        <div>
                                          <label className="text-sm font-medium">Notes administratives</label>
                                          <Textarea
                                            className="mt-1"
                                            placeholder="Expliquez votre décision..."
                                            value={resolutionData.adminNotes || ""}
                                            onChange={(e) =>
                                              setResolutionData({ ...resolutionData, adminNotes: e.target.value })
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}

                                  {/* Already resolved */}
                                  {(selectedOrder.conflictStatus === "RESOLVED" ||
                                    selectedOrder.conflictStatus === false) &&
                                    selectedOrder.reclamation.reviewedBy && (
                                      <div className="bg-green-50 p-4 rounded">
                                        <h4 className="text-sm font-medium text-green-800 mb-2">Résolution</h4>
                                        <div className="text-sm text-green-700">
                                          <div>
                                            <strong>Résolu par:</strong> {selectedOrder.reclamation.reviewedBy}
                                          </div>
                                          <div>
                                            <strong>Le:</strong>{" "}
                                            {new Date(selectedOrder.reclamation.reviewedAt!).toLocaleDateString(
                                              "fr-FR",
                                            )}
                                          </div>
                                          <div>
                                            <strong>Décision:</strong> {selectedOrder.reclamation.resolution}
                                          </div>
                                          {selectedOrder.reclamation.adminNotes && (
                                            <div className="mt-2">
                                              <strong>Notes:</strong> {selectedOrder.reclamation.adminNotes}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                              <DialogFooter>
                                {selectedOrder?.conflictStatus !== "RESOLVED" &&
                                  selectedOrder?.conflictStatus !== false && (
                                    <Button
                                      onClick={handleResolveConflict}
                                      disabled={!resolutionData.resolution || isResolving}
                                    >
                                      {isResolving ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Résolution...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Résoudre le conflit
                                        </>
                                      )}
                                    </Button>
                                  )}
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
