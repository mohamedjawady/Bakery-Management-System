"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Navigation, Package, Truck } from "lucide-react"
import { deliveryApi, type Delivery, getStatusLabel, getStatusColor, formatDeliveryDate } from "@/lib/api/deliveries"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    inTransit: 0,
    delivered: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch deliveries and stats
  useEffect(() => {
    const fetchData = async () => {      try {
        setLoading(true);
        const [deliveriesData, statsData] = await Promise.all([
          deliveryApi.getAllDeliveries(),
          deliveryApi.getDeliveryStats(),
        ]);
        
        console.log("Deliveries received:", deliveriesData)
        console.log("Stats received:", statsData)
        console.log("Ready for delivery count:", deliveriesData.filter(d => d.status === "READY_FOR_DELIVERY").length)
        
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
    }

    fetchData()
  }, [])
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
          <Button>
            <Navigation className="mr-2 h-4 w-4" /> Démarrer l'itinéraire
          </Button>
        </div>        <div className="grid gap-4 md:grid-cols-3">
          <Card>
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
          </Card>
        </div>        <h2 className="text-xl font-semibold mt-4">Commandes Disponibles</h2>
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
              .filter(delivery => delivery.status === "READY_FOR_DELIVERY")
              .map((delivery) => (
                <Card key={delivery._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{delivery.bakeryName}</CardTitle>
                      <Badge className={getStatusColor(delivery.status)}>
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
                    <Button variant="outline" size="sm" className="w-full">
                      <MapPin className="mr-2 h-4 w-4" /> Voir sur la carte
                    </Button>
                    <Button size="sm" className="w-full">
                      Récupérer <Truck className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            {deliveries.filter(delivery => delivery.status === "READY_FOR_DELIVERY").length === 0 && (
              <div className="col-span-2 text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune commande prête pour livraison</p>
              </div>
            )}
          </div>
        )}        <h2 className="text-xl font-semibold mt-4">Livraisons en cours</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {deliveries
            .filter(delivery => delivery.status === "IN_TRANSIT")
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
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" /> Planifier un retard
                  </Button>
                  <Button size="sm" className="w-full">
                    Livré <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          {deliveries.filter(delivery => delivery.status === "IN_TRANSIT").length === 0 && (
            <div className="col-span-2 text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune livraison en cours</p>
            </div>
          )}
        </div>        <h2 className="text-xl font-semibold mt-4">Livraisons terminées</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {deliveries
            .filter(delivery => delivery.status === "DELIVERED")
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
                      <span>Livré: {delivery.actualDeliveryDate ? formatDeliveryDate(delivery.actualDeliveryDate) : 'N/A'}</span>
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
                  <Button variant="outline" size="sm" className="w-full">
                    Détails
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Signature <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          {deliveries.filter(delivery => delivery.status === "DELIVERED").length === 0 && (
            <div className="col-span-2 text-center py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune livraison terminée aujourd'hui</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
