import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, Banknote, BarChart3, ClipboardList, ShoppingBag, Users } from "lucide-react"
import { SalesChart, ProductsChart, BakeriesComparisonChart } from "@/components/charts/sales-chart"

const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 2000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
  { name: 'Jul', sales: 3490 },
];

const productData = [
  { name: 'Pain', sales: 4000 },
  { name: 'Croissant', sales: 3000 },
  { name: 'Baguette', sales: 2000 },
  { name: 'Éclair', sales: 2780 },
  { name: 'Tarte', sales: 1890 },
  { name: 'Macaron', sales: 2390 },
];

const bakeriesData = [
  { name: 'Saint-Michel', value: 35 },
  { name: 'Montmartre', value: 25 },
  { name: 'Opéra', value: 20 },
  { name: 'Bastille', value: 15 },
  { name: 'Marais', value: 5 },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur votre tableau de bord administrateur.</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€45,231.89</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  +20.1%
                </span>{" "}
                par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  +12.2%
                </span>{" "}
                par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  +4.1%
                </span>{" "}
                par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-rose-500 flex items-center">
                  <ArrowDown className="mr-1 h-4 w-4" />
                  -2.5%
                </span>{" "}
                par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Aperçu des ventes</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <SalesChart data={salesData} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                  <CardDescription>Vous avez 12 nouvelles commandes aujourd'hui.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Commande #{Math.floor(Math.random() * 10000)}
                          </p>
                          <p className="text-sm text-muted-foreground">Boulangerie Saint-Michel</p>
                        </div>
                        <div className="ml-auto font-medium">€{(Math.random() * 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Performance des produits</CardTitle>
                  <CardDescription>Ventes par produit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductsChart data={productData} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Répartition des ventes</CardTitle>
                  <CardDescription>Part du chiffre d'affaires par boulangerie</CardDescription>
                </CardHeader>
                <CardContent>
                  <BakeriesComparisonChart data={bakeriesData} />
                </CardContent>
              </Card>
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle>Indicateurs de Performance</CardTitle>
                  <CardDescription>Évolution des KPIs principaux</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { title: "Panier Moyen", value: "€24.50", change: "+5.3%", up: true },
                      { title: "Taux de conversion", value: "3.2%", change: "+0.8%", up: true },
                      { title: "Taux de retour", value: "0.7%", change: "-0.3%", up: true },
                      { title: "Coût d'acquisition", value: "€12.40", change: "+2.1%", up: false }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{item.title}</p>
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className={`text-xs flex items-center ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {item.up ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                          {item.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle>Rapports Disponibles</CardTitle>
                  <CardDescription>Générez et consultez vos rapports d'activité.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { 
                        title: "Rapport mensuel des ventes", 
                        description: "Analyse détaillée des ventes du mois par produit et boulangerie", 
                        date: "01/04/2025", 
                        status: "Prêt" 
                      },
                      { 
                        title: "Analyse de la performance des employés", 
                        description: "Évaluation des performances individuelles et collectives", 
                        date: "15/04/2025", 
                        status: "Prêt" 
                      },
                      { 
                        title: "Audit des ingrédients", 
                        description: "Analyse des coûts et de l'utilisation des ingrédients", 
                        date: "22/04/2025", 
                        status: "Prêt" 
                      },
                      { 
                        title: "Rapport financier trimestriel", 
                        description: "États financiers et prévisions pour Q2 2025", 
                        date: "01/05/2025", 
                        status: "En attente" 
                      },
                      { 
                        title: "Analyse des tendances clients", 
                        description: "Comportements d'achat et préférences des clients", 
                        date: "10/05/2025", 
                        status: "En attente" 
                      }
                    ].map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-base">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{report.date}</p>
                            <p className={`text-xs ${report.status === "Prêt" ? "text-emerald-500" : "text-amber-500"}`}>{report.status}</p>
                          </div>
                          <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
