import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Navigation, Package, Truck } from "lucide-react"

export default function DeliveryDashboard() {
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
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">À livrer aujourd'hui</CardTitle>
              <CardDescription>Total des livraisons du jour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">En cours</CardTitle>
              <CardDescription>Livraisons en transit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Terminées</CardTitle>
              <CardDescription>Livraisons effectuées aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mt-4">Prochaines livraisons</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Boulangerie {["Saint-Michel", "Montmartre", "Opéra", "Bastille"][i % 4]}
                  </CardTitle>
                  <Badge>À livrer</Badge>
                </div>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {
                    [
                      "12 Rue de la Paix, Paris",
                      "45 Avenue des Champs-Élysées, Paris",
                      "8 Boulevard Haussmann, Paris",
                      "22 Rue de Rivoli, Paris",
                    ][i % 4]
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Commande #{Math.floor(Math.random() * 10000)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Livraison prévue à {["10:30", "11:15", "14:30", "16:00"][i % 4]}</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Baguette Tradition</span>
                    <span className="font-medium">x{10 + i * 5}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pain au Chocolat</span>
                    <span className="font-medium">x{20 + i * 5}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Croissant</span>
                    <span className="font-medium">x{15 + i * 5}</span>
                  </div>
                  {i % 2 === 0 && (
                    <div className="flex justify-between">
                      <span>Pain aux Céréales</span>
                      <span className="font-medium">x{8 + i * 2}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <MapPin className="mr-2 h-4 w-4" /> Voir sur la carte
                </Button>
                <Button size="sm">
                  Démarrer <Truck className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>

            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-4">Livraisons en cours</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Boulangerie {["République", "Marais"][i % 2]}</CardTitle>
                  <Badge variant="secondary">En transit</Badge>
                </div>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {["35 Place de la République, Paris", "18 Rue des Rosiers, Paris"][i % 2]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Commande #{Math.floor(Math.random() * 10000)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Départ il y a {10 + i * 5} minutes</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Baguette Tradition</span>
                    <span className="font-medium">x{15 + i * 5}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pain au Chocolat</span>
                    <span className="font-medium">x{25 + i * 5}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Croissant</span>
                    <span className="font-medium">x{20 + i * 5}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" /> Planifier un retard
                </Button>
                <Button size="sm">
                  Livré <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>

            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-4">Livraisons terminées</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Boulangerie {["Louvre", "Trocadéro", "Concorde"][i % 3]}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Livré
                  </Badge>
                </div>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {
                    ["2 Rue du Louvre, Paris", "15 Avenue du Président Wilson, Paris", "1 Place de la Concorde, Paris"][
                    i % 3
                    ]
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Commande #{Math.floor(Math.random() * 10000)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Livré à {["08:30", "09:15", "10:45"][i % 3]}</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Baguette Tradition</span>
                    <span className="font-medium">x{12 + i * 3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pain au Chocolat</span>
                    <span className="font-medium">x{18 + i * 4}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Croissant</span>
                    <span className="font-medium">x{15 + i * 3}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm">
                  Détails
                </Button>
                <Button variant="outline" size="sm">
                  Signature <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>

            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
