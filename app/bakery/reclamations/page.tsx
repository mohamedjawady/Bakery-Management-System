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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, AlertTriangle, Plus, Trash2, Eye, CheckCircle, Filter } from "lucide-react"
import { reportConflict, getConflictOrders, type Discrepancy } from "@/lib/api/conflicts"

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
  products: Array<{
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
  }>
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  hasConflict: boolean
  conflictStatus: "NONE" | "REPORTED" | "UNDER_REVIEW" | "RESOLVED"
  reclamation: {
    reportedBy: string
    reportedAt: string
    description: string
    discrepancies: Discrepancy[]
    reviewedBy?: string
    reviewedAt?: string
    adminNotes?: string
    resolution?: "ACCEPT_AS_IS" | "PARTIAL_REFUND" | "FULL_REFUND" | "REPLACE_ORDER" | "UPDATE_ORDER"
  }
  createdAt: string
}

export default function BakeryReclamationPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersall, setOrdersall] = useState<Order[]>([])
  const [conflictOrders, setConflictOrders] = useState<ConflictOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingConflicts, setLoadingConflicts] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedConflict, setSelectedConflict] = useState<ConflictOrder | null>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [conflictDescription, setConflictDescription] = useState("")
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [activeTab, setActiveTab] = useState<"report" | "view">("view")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "REPORTED" | "UNDER_REVIEW" | "RESOLVED">("ALL")
  const { toast } = useToast()

  // Fetch orders for the bakery
 const fetchOrders = async () => {
  setLoading(true)
  try {
    const userInfo = localStorage.getItem("userInfo")
    const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null
    const token = parsedUserInfo?.token || null
    const bakeryName = parsedUserInfo?.bakeryName || null

    if (!token || !bakeryName) {
      throw new Error("Authentication required")
    }

    const response = await fetch("/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch orders")
    }

    const ordersData = await response.json()

    // Filter orders: status delivered/completed AND bakeryName matches
    const filteredOrders = ordersData.filter(
      (order: Order) =>
        (order.status === "DELIVERED" || order.status === "COMPLETED") &&
        order.bakeryName === bakeryName
    )
const filtered = ordersData.filter(
      (order: Order) =>
        (order.status === "DELIVERED" || order.status === "COMPLETED") &&
        order.bakeryName === bakeryName &&
        order.conflictStatus !== "NONE"
    )
    setOrders(filteredOrders)
    setOrdersall(filtered)
  } catch (error) {
    console.error("Error fetching orders:", error)
    toast({
      title: "Erreur de chargement",
      description:
        error instanceof Error ? error.message : "Impossible de charger les commandes",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}


  // Fetch existing conflict orders for this bakery
  const fetchConflictOrders = async () => {
    setLoadingConflicts(true)
    try {
      const userInfo = localStorage.getItem("userInfo")
      const token = userInfo ? JSON.parse(userInfo).token : null

      if (!token) {
        throw new Error("Authentication required")
      }

      const allConflicts = await getConflictOrders(token)
      // Filter conflicts for this bakery only
      const bakeryInfo = JSON.parse(userInfo!)
      const bakeryConflicts = allConflicts.filter(
        (conflict: ConflictOrder) => conflict.bakeryName === bakeryInfo.bakeryName,
      )
      setConflictOrders(bakeryConflicts)
    } catch (error) {
      console.error("Error fetching conflict orders:", error)
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les réclamations",
        variant: "destructive",
      })
    } finally {
      setLoadingConflicts(false)
    }
  }

  // Add a new discrepancy
  const addDiscrepancy = () => {
    if (!selectedOrder) return

    const newDiscrepancy: Discrepancy = {
      productName: selectedOrder.products[0]?.productName || "",
      ordered: {
        quantity: selectedOrder.products[0]?.quantity || 0,
        unitPrice: selectedOrder.products[0]?.unitPriceTTC || 0,
        totalPrice: selectedOrder.products[0]?.totalPriceTTC || 0,
      },
      received: {
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        condition: "",
      },
      issueType: "QUANTITY_MISMATCH",
      notes: "",
    }

    setDiscrepancies([...discrepancies, newDiscrepancy])
  }

  // Remove a discrepancy
  const removeDiscrepancy = (index: number) => {
    setDiscrepancies(discrepancies.filter((_, i) => i !== index))
  }

  // Update a discrepancy
  const updateDiscrepancy = (index: number, updates: Partial<Discrepancy>) => {
    const updated = discrepancies.map((disc, i) => (i === index ? { ...disc, ...updates } : disc))
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
      const userInfo = localStorage.getItem("userInfo")
      const token = userInfo ? JSON.parse(userInfo).token : null

      if (!token) {
        throw new Error("Authentication required")
      }

      const bakeryInfo = JSON.parse(userInfo!)

      await reportConflict(
        selectedOrder._id,
        {
          reportedBy: selectedOrder.bakeryName,
          description: conflictDescription,
          discrepancies,
        },
        token,
      )

      toast({
        title: "Réclamation signalée",
        description: "Votre réclamation a été transmise à l'administration",
      })

      // Reset form and refresh orders
      setSelectedOrder(null)
      setConflictDescription("")
      setDiscrepancies([])
      fetchOrders()
      fetchConflictOrders() // Also refresh conflict orders
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

  const getStatusBadge = (status: string) => {
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

  const filteredConflictOrders = conflictOrders.filter((conflict) => {
    if (statusFilter === "ALL") return true
    return conflict.conflictStatus === statusFilter
  })
  console.log('filteredConflictOrders', conflictOrders);

  const getStatusCount = (status: "ALL" | "REPORTED" | "UNDER_REVIEW" | "RESOLVED") => {
    if (status === "RESOLVED") return conflictOrders.length
    return conflictOrders.filter((conflict) => conflict.conflictStatus === status).length
  }

  useEffect(() => {
    fetchOrders()
    fetchConflictOrders()
  }, [])

  if (loading && loadingConflicts) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement...</span>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Réclamations</h1>
            <p className="text-muted-foreground">
              Consultez vos réclamations et signalez de nouveaux problèmes de livraison
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                fetchOrders()
                fetchConflictOrders()
              }}
              variant="outline"
              disabled={loading || loadingConflicts}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || loadingConflicts ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button variant={activeTab === "view" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("view")}>
            Mes Réclamations ({getStatusCount("RESOLVED")})
          </Button>
          <Button
            variant={activeTab === "report" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("report")}
          >
            Signaler un Problème
          </Button>
        </div>

        {/* View Existing Reclamations Tab */}
        {activeTab === "view" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Mes Réclamations</CardTitle>
                  <CardDescription>Historique de vos réclamations et leurs résolutions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous ({getStatusCount("ALL")})</SelectItem>
                      <SelectItem value="REPORTED">Signalé ({getStatusCount("REPORTED")})</SelectItem>
                      <SelectItem value="UNDER_REVIEW">En cours ({getStatusCount("UNDER_REVIEW")})</SelectItem>
                      <SelectItem value="RESOLVED">Résolu ({getStatusCount("RESOLVED")})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConflicts ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Chargement des réclamations...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande</TableHead>
                        <TableHead>Signalé le</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Problèmes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersall.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            {statusFilter === "RESOLVED"
                              ? "Aucune réclamation trouvée"
                              : `Aucune réclamation ${statusFilter.toLowerCase()} trouvée`}
                          </TableCell>
                        </TableRow>
                      ) : (
                        ordersall.map((conflict) => (
                          <TableRow key={conflict._id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{conflict.orderReferenceId}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(conflict.scheduledDate).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(conflict.reclamation.reportedAt).toLocaleDateString("fr-FR")}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(conflict.conflictStatus)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {conflict.reclamation.discrepancies?.slice(0, 2).map((disc, idx) => (
                                  <div key={idx}>{getIssueTypeBadge(disc.issueType)}</div>
                                ))}
                                {conflict.reclamation.discrepancies?.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{conflict.reclamation.discrepancies.length - 2} autres
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedConflict(conflict)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Voir Détails
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Réclamation - Commande {conflict.orderReferenceId}</DialogTitle>
                                    <DialogDescription>
                                      Signalée le{" "}
                                      {new Date(conflict.reclamation.reportedAt).toLocaleDateString("fr-FR")}
                                    </DialogDescription>
                                  </DialogHeader>

                                  {selectedConflict && (
                                    <div className="space-y-6">
                                      {/* Your original problem description */}
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Votre description du problème</h4>
                                        <p className="text-sm bg-muted p-3 rounded">
                                          {selectedConflict.reclamation.description}
                                        </p>
                                      </div>

                                      {/* Discrepancies you reported */}
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Écarts signalés</h4>
                                        <div className="space-y-3">
                                          {selectedConflict.reclamation.discrepancies?.map((disc, idx) => (
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
                                                  Vos notes: {disc.notes}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Admin resolution */}
                                      {selectedConflict.conflictStatus === "RESOLVED" &&
                                        selectedConflict.reclamation.reviewedBy && (
                                          <div className="bg-green-50 p-4 rounded border border-green-200">
                                            <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Résolution Administrative
                                            </h4>
                                            <div className="space-y-2 text-sm text-green-700">
                                              <div>
                                                <strong>Résolu par:</strong> {selectedConflict.reclamation.reviewedBy}
                                              </div>
                                              <div>
                                                <strong>Date de résolution:</strong>{" "}
                                                {new Date(selectedConflict.reclamation.reviewedAt!).toLocaleDateString(
                                                  "fr-FR",
                                                )}
                                              </div>
                                              <div>
                                                <strong>Décision:</strong>
                                                <span className="ml-2">
                                                  {selectedConflict.reclamation.resolution === "ACCEPT_AS_IS" &&
                                                    "Accepter en l'état"}
                                                  {selectedConflict.reclamation.resolution === "PARTIAL_REFUND" &&
                                                    "Remboursement partiel"}
                                                  {selectedConflict.reclamation.resolution === "FULL_REFUND" &&
                                                    "Remboursement complet"}
                                                  {selectedConflict.reclamation.resolution === "REPLACE_ORDER" &&
                                                    "Remplacer la commande"}
                                                  {selectedConflict.reclamation.resolution === "UPDATE_ORDER" &&
                                                    "Corriger la commande"}
                                                </span>
                                              </div>
                                              {selectedConflict.reclamation.adminNotes && (
                                                <div className="mt-3">
                                                  <strong>Notes administratives:</strong>
                                                  <div className="mt-1 p-2 bg-white rounded border text-gray-700">
                                                    {selectedConflict.reclamation.adminNotes}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Status if not resolved */}
                                      {selectedConflict.conflictStatus !== "RESOLVED" && (
                                        <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                          <h4 className="text-sm font-medium text-blue-800 mb-2">Statut Actuel</h4>
                                          <div className="text-sm text-blue-700">
                                            {selectedConflict.conflictStatus === "REPORTED" &&
                                              "Votre réclamation a été reçue et est en attente d'examen par l'administration."}
                                            {selectedConflict.conflictStatus === "UNDER_REVIEW" &&
                                              "Votre réclamation est actuellement en cours d'examen par l'administration."}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report New Problem Tab */}
        {activeTab === "report" && (
          <Card>
            <CardHeader>
              <CardTitle>Commandes Livrées</CardTitle>
              <CardDescription>Sélectionnez une commande pour signaler un problème</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Chargement des commandes...
                </div>
              ) : (
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
                            <TableCell className="font-medium">{order.orderReferenceId}</TableCell>
                            <TableCell>{new Date(order.scheduledDate).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell>{order.deliveryUserName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {order.conflictStatus === "REPORTED" ? (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Conflit signalé
                                  </Badge>
                                ) : order.conflictStatus === "NONE" ? (
                                  <Badge variant="destructive">
                                    Signaler s’il y a un problème
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    {order.conflictStatus}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>{order.orderTotalTTC?.toFixed(2)} €</TableCell>
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
                                      <DialogTitle>
                                        Signaler un Problème - Commande {order.orderReferenceId}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Décrivez les écarts entre ce que vous avez commandé et ce que vous avez reçu
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                      {/* General Description */}
                                      <div>
                                        <label className="text-sm font-medium">
                                          Description générale du problème *
                                        </label>
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
                                          <Button type="button" variant="outline" size="sm" onClick={addDiscrepancy}>
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
                                                    onValueChange={(value) =>
                                                      updateDiscrepancy(index, { productName: value })
                                                    }
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
                                                    onValueChange={(value) =>
                                                      updateDiscrepancy(index, { issueType: value as any })
                                                    }
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="QUANTITY_MISMATCH">
                                                        Quantité incorrecte
                                                      </SelectItem>
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
                                                    onChange={(e) =>
                                                      updateDiscrepancy(index, {
                                                        ordered: {
                                                          ...disc.ordered,
                                                          quantity: Number.parseInt(e.target.value) || 0,
                                                        },
                                                      })
                                                    }
                                                  />
                                                </div>

                                                <div>
                                                  <label className="text-sm font-medium">Quantité reçue</label>
                                                  <Input
                                                    type="number"
                                                    value={disc.received.quantity}
                                                    onChange={(e) =>
                                                      updateDiscrepancy(index, {
                                                        received: {
                                                          ...disc.received,
                                                          quantity: Number.parseInt(e.target.value) || 0,
                                                        },
                                                      })
                                                    }
                                                  />
                                                </div>

                                                <div className="md:col-span-2">
                                                  <label className="text-sm font-medium">État du produit reçu</label>
                                                  <Input
                                                    placeholder="ex: endommagé, expiré, différent..."
                                                    value={disc.received.condition || ""}
                                                    onChange={(e) =>
                                                      updateDiscrepancy(index, {
                                                        received: { ...disc.received, condition: e.target.value },
                                                      })
                                                    }
                                                  />
                                                </div>

                                                <div className="md:col-span-2">
                                                  <label className="text-sm font-medium">Notes supplémentaires</label>
                                                  <Textarea
                                                    placeholder="Détails supplémentaires sur ce problème..."
                                                    value={disc.notes || ""}
                                                    onChange={(e) =>
                                                      updateDiscrepancy(index, { notes: e.target.value })
                                                    }
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
                              {order.hasConflict && <Badge variant="outline">Déjà signalé</Badge>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
