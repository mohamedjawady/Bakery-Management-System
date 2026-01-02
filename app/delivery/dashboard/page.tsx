"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Navigation, Package, Truck, Info } from "lucide-react"
import {
  type Delivery,
  getStatusLabel,
  getStatusColor,
  formatDeliveryDate,
  type DeliveryStatus,
} from "@/lib/api/deliveries"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { priceVisible } from "@/lib/config"
import { formatPrice } from "@/lib/utils"

const API_DELIVERIES_URL = "/api/deliveries"

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    inTransit: 0,
    delivered: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }, [])

  const handleAuthError = useCallback(() => {
    toast({
      title: "Session expirée",
      description: "Veuillez vous reconnecter.",
      variant: "destructive",
    })
    router.push("/login")
  }, [toast, router])

  const fetchData = useCallback(async () => {
    const token = getToken()
    if (!token) {
      handleAuthError()
      return
    }

    try {
      setLoading(true)
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      const [deliveriesResponse, statsResponse] = await Promise.all([
        fetch(API_DELIVERIES_URL, { headers }),
        fetch(`${API_DELIVERIES_URL}`, { headers }), // Assuming a /stats endpoint on your backend
      ])

      if (!deliveriesResponse.ok) {
        if (deliveriesResponse.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Failed to fetch deliveries")
      }
      const deliveriesData: Delivery[] = await deliveriesResponse.json()

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Failed to fetch delivery stats")
      }
      const statsData = await statsResponse.json()

      setDeliveries(deliveriesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching delivery data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de livraison",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, handleAuthError, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStatus = async (
    deliveryId: string,
    newStatus: DeliveryStatus,
    successMessage: string,
    errorMessage: string,
    notes?: string,
  ) => {
    setIsActionLoading(true)
    const token = getToken()
    const userInfo = localStorage.getItem("userInfo")
    const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null

    if (!token || !parsedUserInfo) {
      handleAuthError()
      setIsActionLoading(false)
      return
    }

    try {
      const response = await fetch(`${"/orders"}/${deliveryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes,
          deliveryUserId: parsedUserInfo.email, // 👈 email as ID
          deliveryUserName: `${parsedUserInfo.firstName} ${parsedUserInfo.lastName}`, // 👈 full name
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.message || errorMessage)
      }

      toast({
        title: "Succès",
        description: successMessage,
      })
      fetchData()
    } catch (error: any) {
      console.error(`Error updating delivery status to ${newStatus}:`, error)
      toast({
        title: "Erreur",
        description: error.message || errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }


  const handlePickUp = (deliveryId: string) => {
    handleUpdateStatus(
      deliveryId,
      "IN_TRANSIT",
      "Livraison marquée comme 'En transit'.",
      "Impossible de marquer la livraison comme 'En transit'.",
    )
  }

  const handleDeliver = (deliveryId: string) => {
    handleUpdateStatus(
      deliveryId,
      "DELIVERED",
      "Livraison marquée comme 'Livrée'.",
      "Impossible de marquer la livraison comme 'Livrée'.",
    )
  }

  const handleScheduleDelay = (deliveryId: string) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La planification d'un retard n'est pas encore implémentée.",
      variant: "default",
    })
    // In a real app, this would open a dialog for inputting delay details
  }

  const handleViewDetails = async (deliveryId: string) => {
    setIsActionLoading(true)
    const token = getToken()
    if (!token) {
      handleAuthError()
      setIsActionLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_DELIVERIES_URL}/${deliveryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch delivery details")
      }

      const delivery: Delivery = await response.json()
      setSelectedDelivery(delivery)
      setShowDetailsModal(true)
    } catch (error: any) {
      console.error("Error fetching delivery details:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les détails de la livraison.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <DashboardLayout role="delivery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Livraisons</h1>
            <p className="text-muted-foreground">
              Tableau de bord des livraisons du{" "}
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {/* <Button disabled={isActionLoading}>
            <Navigation className="mr-2 h-4 w-4" /> Démarrer l'itinéraire
          </Button> */}
        </div>{" "}
        <div className="grid gap-4 md:grid-cols-3">
          {/* <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">À livrer aujourd'hui</CardTitle>
              <CardDescription>Total des livraisons du jour</CardDescription>
              
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.ready}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">En cours</CardTitle>
              <CardDescription>Livraisons en transit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.inTransit}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Terminées</CardTitle>
              <CardDescription>Livraisons effectuées aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.delivered}</div>
            </CardContent>
          </Card> */}
        </div>{" "}
        <h2 className="text-xl font-semibold mt-4">Commandes Disponibles</h2>
        <p className="text-sm text-muted-foreground mb-4">Commandes prêtes à être récupérées pour livraison</p>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {deliveries
              .filter((delivery) => delivery.status === "READY_FOR_DELIVERY")
              .map((delivery) => (
                <Card key={delivery._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{delivery.bakeryName}</CardTitle>
                      <Badge className={getStatusColor(delivery.status)}>{getStatusLabel(delivery.status)}</Badge>
                    </div>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {delivery.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Commande #{delivery.orderReferenceId}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Prévue: {formatDeliveryDate(delivery.scheduledDate)}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {delivery.products?.slice(0, 3).map((product, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{product.productName}</span>
                          <span className="font-medium">x{product.quantity}</span>
                        </div>
                      ))}
                      {delivery.products && delivery.products.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{delivery.products.length - 3} autres produits
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleViewDetails(delivery._id)}
                      disabled={isActionLoading}
                    >
                      <Info className="mr-2 h-4 w-4" /> Détails
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handlePickUp(delivery._id)}
                      disabled={isActionLoading}
                    >
                      Récupérer <Truck className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            {deliveries.filter((delivery) => delivery.status === "READY_FOR_DELIVERY").length === 0 && (
              <div className="col-span-2 text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune commande prête pour livraison</p>
              </div>
            )}
          </div>
        )}{" "}
        <h2 className="text-xl font-semibold mt-4">Livraisons en cours</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {deliveries
            .filter((delivery) => delivery.status === "IN_TRANSIT")
            .map((delivery) => (
              <Card key={delivery._id} className="overflow-hidden border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{delivery.bakeryName}</CardTitle>
                    <Badge variant="secondary" className={getStatusColor(delivery.status)}>
                      {getStatusLabel(delivery.status)}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {delivery.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>Commande #{delivery.orderReferenceId}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>Départ: {formatDeliveryDate(delivery.scheduledDate)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {delivery.products?.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{product.productName}</span>
                        <span className="font-medium">x{product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleScheduleDelay(delivery._id)}
                    disabled={isActionLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Planifier un retard
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeliver(delivery._id)}
                    disabled={isActionLoading}
                  >
                    Livré <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          {deliveries.filter((delivery) => delivery.status === "IN_TRANSIT").length === 0 && (
            <div className="col-span-2 text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune livraison en cours</p>
            </div>
          )}
        </div>{" "}
        <h2 className="text-xl font-semibold mt-4">Livraisons terminées</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {deliveries
            .filter((delivery) => delivery.status === "DELIVERED")
            .slice(0, 6) // Show only recent 6 deliveries
            .map((delivery) => (
              <Card key={delivery._id} className="overflow-hidden border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{delivery.bakeryName}</CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {getStatusLabel(delivery.status)}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {delivery.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>Commande #{delivery.orderReferenceId}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>
                        Livré: {delivery.actualDeliveryDate ? formatDeliveryDate(delivery.actualDeliveryDate) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {delivery.products?.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{product.productName}</span>
                        <span className="font-medium">x{product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleViewDetails(delivery._id)}
                    disabled={isActionLoading}
                  >
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleViewDetails(delivery._id)} // Assuming signature also shows details
                    disabled={isActionLoading}
                  >
                    Signature <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          {deliveries.filter((delivery) => delivery.status === "DELIVERED").length === 0 && (
            <div className="col-span-2 text-center py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune livraison terminée aujourd'hui</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de la Livraison</DialogTitle>
            <DialogDescription>Informations complètes sur la commande et la livraison.</DialogDescription>
          </DialogHeader>
          {selectedDelivery ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium col-span-1">Boulangerie:</span>
                <span className="col-span-3">{selectedDelivery.bakeryName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium col-span-1">Adresse:</span>
                <span className="col-span-3">{selectedDelivery.address}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium col-span-1">Référence Commande:</span>
                <span className="col-span-3">#{selectedDelivery.orderReferenceId}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium col-span-1">Statut:</span>
                <Badge className={getStatusColor(selectedDelivery.status)}>
                  {getStatusLabel(selectedDelivery.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium col-span-1">Date Prévue:</span>
                <span className="col-span-3">{new Date(selectedDelivery.scheduledDate).toLocaleString("fr-FR")}</span>
              </div>
              {selectedDelivery.actualDeliveryDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Date de Livraison:</span>
                  <span className="col-span-3">
                    {new Date(selectedDelivery.actualDeliveryDate).toLocaleString("fr-FR")}
                  </span>
                </div>
              )}
              {selectedDelivery.notes && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Notes:</span>
                  <span className="col-span-3">{selectedDelivery.notes}</span>
                </div>
              )}

              <Separator className="my-2" />

              <h3 className="text-md font-semibold">Produits:</h3>
              {selectedDelivery.products && selectedDelivery.products.length > 0 ? (
                <div className="space-y-2">
                  {selectedDelivery.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {product.productName} (x{product.quantity})
                      </span>
                      {priceVisible && (
                        <span className="font-medium">{formatPrice(product.totalPriceTTC || product.totalPrice)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun produit listé.</p>
              )}

              <Separator className="my-2" />

              {priceVisible && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium col-span-1">Total HT:</span>
                    <span className="col-span-3">{formatPrice(selectedDelivery.orderTotalHT || 0)}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium col-span-1">Montant TVA:</span>
                    <span className="col-span-3">{formatPrice(selectedDelivery.orderTaxAmount || 0)}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium col-span-1">Total TTC:</span>
                    <span className="col-span-3">{formatPrice(selectedDelivery.orderTotalTTC || 0)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">Chargement des détails...</div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}