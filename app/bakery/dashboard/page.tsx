import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, ClipboardCheck, ClipboardList, Clock, Plus, ShoppingBag } from "lucide-react"

export default function BakeryDashboard() {
  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boulangerie Saint-Michel</h1>
            <p className="text-muted-foreground">Bienvenue sur votre tableau de bord boulangerie.</p>
          </div>
          <Button className="hidden md:flex">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle commande
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes du jour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">8 en attente, 12 en préparation, 4 terminées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits populaires</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
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
              <div className="text-2xl font-bold">14:30</div>
              <p className="text-xs text-muted-foreground">Dans 2 heures et 15 minutes</p>
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
                <CardDescription>Vous avez 8 commandes en attente de traitement.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Commande #{Math.floor(Math.random() * 10000)}</CardTitle>
                          <Badge>En attente</Badge>
                        </div>
                        <CardDescription>Reçue il y a {Math.floor(Math.random() * 60)} minutes</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <ul className="space-y-1 text-sm">
                          <li className="flex justify-between">
                            <span>Baguette Tradition</span>
                            <span>x10</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Pain au Chocolat</span>
                            <span>x15</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Croissant</span>
                            <span>x12</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                        <Button size="sm">
                          Accepter <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en préparation</CardTitle>
                <CardDescription>Vous avez 12 commandes en cours de préparation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Commande #{Math.floor(Math.random() * 10000)}</CardTitle>
                          <Badge variant="secondary">En préparation</Badge>
                        </div>
                        <CardDescription>
                          En préparation depuis {Math.floor(Math.random() * 60)} minutes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span>75%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                        <Button size="sm">
                          Terminer <ClipboardCheck className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes terminées</CardTitle>
                <CardDescription>Vous avez terminé 4 commandes aujourd'hui.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Commande #{Math.floor(Math.random() * 10000)}</CardTitle>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Terminée
                          </Badge>
                        </div>
                        <CardDescription>Terminée il y a {Math.floor(Math.random() * 120)} minutes</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <ul className="space-y-1 text-sm">
                          <li className="flex justify-between">
                            <span>Baguette Tradition</span>
                            <span>x8</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Pain aux Céréales</span>
                            <span>x5</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                        <Button variant="outline" size="sm">
                          Facture <ClipboardList className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
