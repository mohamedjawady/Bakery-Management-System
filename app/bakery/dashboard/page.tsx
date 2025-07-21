// app/bakery-dashboard/page.tsx
// This is your bakery dashboard, now integrated with the backend API.

"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, ClipboardCheck, ClipboardList, Clock, Plus, ShoppingBag, RefreshCw } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { format, isToday, isFuture, differenceInMinutes, differenceInHours } from "date-fns"
import { fr } from "date-fns/locale" // Import French locale for date-fns
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator" // Added Separator for design
import { ScrollArea } from "@/components/ui/scroll-area" // Added ScrollArea for details dialog
import { useToast } from "@/hooks/use-toast" // Import useToast
import { useRouter } from "next/navigation" // Import useRouter
import type { Order } from "@/types/order" // Corrected import path

export default function BakeryDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast() // Initialize useToast
  const router = useRouter() // Initialize useRouter

  // Function to fetch orders from the Next.js API route
  const fetchOrdersData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/orders`, {
        cache: "no-store", // Ensure fresh data on each request
      })

      if (!response.ok) {
        console.error("Failed to fetch orders from API route:", response.status, response.statusText)
        try {
          const errorBody = await response.json()
          console.error("Error details:", errorBody)
        } catch (e) {
          console.error("Could not parse error body.")
        }
        setError("Failed to load orders. Please check your backend server.")
        setOrders([])
        return
      }

      const orders: Order[] = await response.json()
      setOrders(orders)
      setError(null) // Clear any previous errors
    } catch (err) {
      setError("Failed to load orders. Please check your backend server.")
      console.error("Error fetching orders:", err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrdersData()
  }, [fetchOrdersData])

  // Filter orders based on status and date
  const todayOrders = useMemo(() => orders.filter((order) => isToday(new Date(order.scheduledDate))), [orders])
  const pendingOrders = useMemo(() => todayOrders.filter((order) => order.status === "PENDING"), [todayOrders])
  const processingOrders = useMemo(() => todayOrders.filter((order) => order.status === "IN_PROGRESS"), [todayOrders])
  const completedOrders = useMemo(() => todayOrders.filter((order) => order.status === "DELIVERED"), [todayOrders])

  // Calculate next delivery
  const nextDelivery = useMemo(() => {
    const now = new Date()
    return orders
      .filter((order) => isFuture(new Date(order.scheduledDate)) && order.status !== "DELIVERED")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }, [orders])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Failed to update order ${orderId} to ${newStatus}:`, errorData)
        toast({
          title: "Erreur de mise à jour",
          description: `Échec de la mise à jour de la commande: ${errorData.message || response.statusText}`,
          variant: "destructive",
        })
        return
      }

      // Refresh orders after successful update
      fetchOrdersData()
      toast({
        title: "Mise à jour réussie",
        description: `Le statut de la commande ${orderId} a été mis à jour à ${newStatus}.`,
      })
    } catch (err) {
      console.error(`Error updating order ${orderId}:`, err)
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la mise à jour de la commande.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "IN_PROGRESS")
  }

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "DELIVERED")
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex flex-col gap-4 p-4">
          <div className="text-center text-muted-foreground">Chargement des données du tableau de bord...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex flex-col gap-4 p-4">
          <div className="text-center text-red-500">{error}</div>
          <div className="text-center text-muted-foreground text-sm">
            Please ensure your backend API is running at `http://localhost:5000/orders` and accessible.
            <br />
            For the v0 preview, this API endpoint is not accessible. You will see data when running locally with your
            backend.
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boulangerie Saint-Michel</h1>
            <p className="text-muted-foreground">Bienvenue sur votre tableau de bord boulangerie.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => router.push('/bakery/orders')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
            <Button onClick={fetchOrdersData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes du jour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingOrders.length} en attente, {processingOrders.length} en préparation, {completedOrders.length}{" "}
                terminées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits populaires</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* This data would require aggregation on the backend or client-side */}
              <div className="text-2xl font-bold">Baguette Tradition</div>
              <p className="text-xs text-muted-foreground">Vendu 128 fois cette semaine</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine livraison</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextDelivery ? (
                <>
                  <div className="text-2xl font-bold">
                    {format(new Date(nextDelivery.scheduledDate), "HH:mm", { locale: fr })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dans{" "}
                    {differenceInHours(new Date(nextDelivery.scheduledDate), new Date()) > 0
                      ? `${differenceInHours(new Date(nextDelivery.scheduledDate), new Date())} heures et `
                      : ""}
                    {differenceInMinutes(new Date(nextDelivery.scheduledDate), new Date()) % 60} minutes
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">Aucune</div>
              )}
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="processing">En préparation</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en attente</CardTitle>
                <CardDescription>Vous avez {pendingOrders.length} commandes en attente de traitement.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande en attente.</div>
                  ) : (
                    pendingOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge>En attente</Badge>
                          </div>
                          <CardDescription>
                            Reçue il y a {differenceInMinutes(new Date(), new Date(order.createdAt))} minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ul className="space-y-1 text-sm">
                            {order.products.map((product, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{product.productName}</span>
                                <span>x{product.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                          <Button size="sm" onClick={() => handleAcceptOrder(order._id)}>
                            Accepter <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en préparation</CardTitle>
                <CardDescription>
                  Vous avez {processingOrders.length} commandes en cours de préparation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processingOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande en préparation.</div>
                  ) : (
                    processingOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge variant="secondary">En préparation</Badge>
                          </div>
                          <CardDescription>
                            En préparation depuis {differenceInMinutes(new Date(), new Date(order.createdAt))} minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="space-y-2">
                            {/* Placeholder for progress, you might need actual progress data */}
                            <div className="flex justify-between text-sm">
                              <span>Progression</span>
                              <span>75%</span> {/* This is still hardcoded */}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                          <Button size="sm" onClick={() => handleCompleteOrder(order._id)}>
                            Terminer <ClipboardCheck className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes terminées</CardTitle>
                <CardDescription>Vous avez terminé {completedOrders.length} commandes aujourd'hui.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">Aucune commande terminée.</div>
                  ) : (
                    completedOrders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Commande #{order.orderId}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Terminée
                            </Badge>
                          </div>
                          <CardDescription>
                            Terminée il y a{" "}
                            {differenceInMinutes(new Date(), new Date(order.actualDeliveryDate || order.updatedAt))}{" "}
                            minutes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ul className="space-y-1 text-sm">
                            {order.products.map((product, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{product.productName}</span>
                                <span>x{product.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                            Détails
                          </Button>
                      
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Détails de la Commande #{selectedOrder?.orderId}</DialogTitle>
            <DialogDescription>Informations détaillées sur la commande sélectionnée.</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <ScrollArea className="flex-1 pr-4">
              {" "}
              {/* Added ScrollArea here */}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                  <span className="font-medium text-muted-foreground">Référence:</span>
                  <span className="font-semibold">{selectedOrder.orderReferenceId}</span>

                  <span className="font-medium text-muted-foreground">Boulangerie:</span>
                  <span className="font-semibold">{selectedOrder.bakeryName}</span>

                  <span className="font-medium text-muted-foreground">Livreur:</span>
                  <span className="font-semibold">{selectedOrder.deliveryUserName}</span>

                  <span className="font-medium text-muted-foreground">Adresse:</span>
                  <span className="font-semibold">{selectedOrder.address}</span>

                  <span className="font-medium text-muted-foreground">Date prévue:</span>
                  <span className="font-semibold">
                    {format(new Date(selectedOrder.scheduledDate), "PPP HH:mm", { locale: fr })}
                  </span>

                  <span className="font-medium text-muted-foreground">Statut:</span>
                  <span>
                    <Badge>{selectedOrder.status}</Badge>
                  </span>

                  {selectedOrder.notes && (
                    <>
                      <span className="font-medium text-muted-foreground">Notes:</span>
                      <span>{selectedOrder.notes}</span>
                    </>
                  )}

                  <span className="font-medium text-muted-foreground">Créée le:</span>
                  <span>{format(new Date(selectedOrder.createdAt), "PPP HH:mm", { locale: fr })}</span>

                  <span className="font-medium text-muted-foreground">Dernière mise à jour:</span>
                  <span>{format(new Date(selectedOrder.updatedAt), "PPP HH:mm", { locale: fr })}</span>
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-semibold">Produits:</h3>
                <ul className="space-y-3">
                  {selectedOrder.products.map((product, idx) => (
                    <li key={idx} className="border rounded-md p-3 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-base">{product.productName}</span>
                        <span className="text-primary font-bold">x{product.quantity}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Laboratoire: {product.laboratory}</div>
                      <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix HT:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                              product.unitPriceHT,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TVA:</span>
                          <span className="font-medium">{product.taxRate * 100}%</span>
                        </div>
                        <div className="flex justify-between col-span-2 mt-1">
                          <span className="font-semibold">Total TTC:</span>
                          <span className="font-bold text-primary">
                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                              product.totalPriceTTC,
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                <div className="grid gap-2">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total HT Commande:</span>
                    <span>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                        selectedOrder.orderTotalHT,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Montant TVA Commande:</span>
                    <span>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                        selectedOrder.orderTaxAmount,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold mt-2 text-primary">
                    <span>Total TTC Commande:</span>
                    <span>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                        selectedOrder.orderTotalTTC,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-4">Aucune commande sélectionnée.</div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
