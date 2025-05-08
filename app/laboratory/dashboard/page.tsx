import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, CheckCircle2, Clock, ClipboardList, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function LaboratoryDashboard() {
  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laboratoire Central</h1>
            <p className="text-muted-foreground">
              Tableau de production du{" "}
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Rechercher..." className="w-full md:w-[200px] pl-8 rounded-md" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">À produire</CardTitle>
              <CardDescription>Commandes en attente de production</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">En production</CardTitle>
              <CardDescription>Commandes en cours de préparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Terminées</CardTitle>
              <CardDescription>Commandes prêtes pour livraison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">15</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mt-4">Tableau de production</h2>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commandes à produire</CardTitle>
                  <CardDescription>Commandes en attente de traitement</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">À produire</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Commande #{Math.floor(Math.random() * 10000)}</h3>
                        <p className="text-sm text-muted-foreground">Boulangerie Saint-Michel</p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Livraison: 14:30</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Baguette Tradition</span>
                        <span className="font-medium">x25</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pain au Chocolat</span>
                        <span className="font-medium">x40</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Croissant</span>
                        <span className="font-medium">x35</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm">
                        Démarrer la production <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>En production</CardTitle>
                  <CardDescription>Commandes en cours de préparation</CardDescription>
                </div>
                <Badge variant="secondary">En cours</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Commande #{Math.floor(Math.random() * 10000)}</h3>
                        <p className="text-sm text-muted-foreground">Boulangerie Montmartre</p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Démarré il y a {Math.floor(Math.random() * 60)} min</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Baguette Tradition (x30)</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Pain de Campagne (x15)</span>
                          <span>50%</span>
                        </div>
                        <Progress value={50} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Croissant (x45)</span>
                          <span>25%</span>
                        </div>
                        <Progress value={25} className="h-2" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm">
                        Terminer <CheckCircle2 className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prêt pour livraison</CardTitle>
                  <CardDescription>Commandes terminées en attente de livraison</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Terminé
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Commande #{Math.floor(Math.random() * 10000)}</h3>
                        <p className="text-sm text-muted-foreground">Boulangerie Opéra</p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Terminé il y a {Math.floor(Math.random() * 30)} min</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Baguette Tradition</span>
                        <span className="font-medium">x20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pain aux Céréales</span>
                        <span className="font-medium">x15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pain au Chocolat</span>
                        <span className="font-medium">x30</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        Bon de livraison <ClipboardList className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
