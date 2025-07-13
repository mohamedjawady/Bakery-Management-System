"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDown, ArrowUp, Banknote, BarChart3, ClipboardList, ShoppingBag, Users, Download, Loader2 } from "lucide-react"
import { SalesChart, ProductsChart, BakeriesComparisonChart } from "@/components/charts/sales-chart"
import { useToast } from "@/hooks/use-toast"
import {
  getDashboardOverview,
  getSalesChartData,
  getProductPerformance,
  getBakeryComparison,
  getRecentOrders,
  getPerformanceIndicators,
  exportSalesReport,
  exportProductReport,
  exportFinancialReport,
  exportWeeklyBilling
} from "@/lib/api/dashboard"

interface DashboardData {
  revenue: {
    current: number
    change: number
    formatted: string
  }
  orders: {
    current: number
    change: number
  }
  products: {
    active: number
    available: number
    total: number
  }
  users: {
    active: number
    total: number
  }
  averageOrderValue: {
    current: number
    formatted: string
  }
}

interface SalesData {
  name: string
  sales: number
}

interface ProductData {
  name: string
  sales: number
  quantity: number
}

interface BakeryData {
  name: string
  value: number
}

interface RecentOrder {
  orderId: string
  bakeryName: string
  amount: number
  status: string
  createdAt: string
}

interface PerformanceIndicator {
  title: string
  value: string
  change: string
  up: boolean
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardData | null>(null)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [bakeryData, setBakeryData] = useState<BakeryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [performanceIndicators, setPerformanceIndicators] = useState<PerformanceIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [weeklyBillingDates, setWeeklyBillingDates] = useState({
    startDate: '',
    endDate: ''
  })
  const [weeklyBillingLoading, setWeeklyBillingLoading] = useState(false)
  const { toast } = useToast()

  const fetchDashboardData = async () => {
    // Check if we're in the browser and have a token
    if (typeof window === 'undefined') {
      console.log('Window is undefined, skipping API calls')
      setLoading(false)
      return
    }

    // Get token from userInfo object in localStorage
    const userInfo = localStorage.getItem('userInfo')
    let token = null
    
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo)
        token = parsedUserInfo.token
      } catch (error) {
        console.error('Error parsing userInfo from localStorage:', error)
      }
    }
    
    console.log('Token check - userInfo exists:', !!userInfo)
    console.log('Token check - token exists:', !!token)
    
    if (!token) {
      console.log('No token found in userInfo')
      setLoading(false)
      return
    }

    try {
      console.log('Starting API calls...')
      setLoading(true)
      
      // Fetch all dashboard data in parallel
      const [
        overviewRes,
        salesRes,
        productRes,
        bakeryRes,
        ordersRes,
        indicatorsRes
      ] = await Promise.all([
        getDashboardOverview(),
        getSalesChartData(),
        getProductPerformance(),
        getBakeryComparison(),
        getRecentOrders(),
        getPerformanceIndicators()
      ])

      console.log('API calls completed successfully')
      setOverview(overviewRes.data)
      setSalesData(salesRes.data)
      setProductData(productRes.data)
      setBakeryData(bakeryRes.data)
      setRecentOrders(ordersRes.data)
      setPerformanceIndicators(indicatorsRes.data)
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'sales' | 'products' | 'financial') => {
    try {
      setExportLoading(type)
      
      switch (type) {
        case 'sales':
          await exportSalesReport()
          break
        case 'products':
          await exportProductReport()
          break
        case 'financial':
          await exportFinancialReport()
          break
      }
      
      toast({
        title: "Export réussi",
        description: "Le rapport a été téléchargé avec succès.",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export.",
        variant: "destructive",
      })
    } finally {
      setExportLoading(null)
    }
  }

  const handleWeeklyBillingExport = async () => {
    if (!weeklyBillingDates.startDate || !weeklyBillingDates.endDate) {
      toast({
        title: "Dates requises",
        description: "Veuillez sélectionner une date de début et une date de fin.",
        variant: "destructive",
      })
      return
    }

    try {
      setWeeklyBillingLoading(true)
      await exportWeeklyBilling(weeklyBillingDates.startDate, weeklyBillingDates.endDate)
      
      toast({
        title: "Export réussi",
        description: "La facturation hebdomadaire a été téléchargée avec succès.",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export de la facturation hebdomadaire:', error)
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export.",
        variant: "destructive",
      })
    } finally {
      setWeeklyBillingLoading(false)
    }
  }

  // Helper function to get current week dates
  const getCurrentWeekDates = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday start
    const monday = new Date(now.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    }
  }

  // Helper function to get previous week dates
  const getPreviousWeekDates = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - 7 // Previous Monday
    const monday = new Date(now.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    console.log('Dashboard useEffect running...')
    
    // Test basic API connectivity first
    const testApiConnectivity = async () => {
      try {
        console.log('Testing API connectivity...')
        const response = await fetch('http://localhost:5000/api/dashboard/test')
        const data = await response.json()
        console.log('API test successful:', data)
      } catch (error) {
        console.error('API test failed:', error)
      }
    }
    
    testApiConnectivity()
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }
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
              <div className="text-2xl font-bold">{overview?.revenue.formatted || "€0.00"}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`flex items-center ${(overview?.revenue.change || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {(overview?.revenue.change || 0) >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {(overview?.revenue.change || 0) >= 0 ? '+' : ''}{(overview?.revenue.change || 0).toFixed(1)}%
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
              <div className="text-2xl font-bold">{overview?.orders.current || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`flex items-center ${(overview?.orders.change || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {(overview?.orders.change || 0) >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {(overview?.orders.change || 0) >= 0 ? '+' : ''}{(overview?.orders.change || 0).toFixed(1)}%
                </span>{" "}
                par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.products.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-muted-foreground">
                  {overview?.products.available || 0} disponibles sur {overview?.products.total || 0} total
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.users.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-muted-foreground">
                  sur {overview?.users.total || 0} utilisateurs total
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
            <TabsTrigger value="billing">Facturation</TabsTrigger>
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
                  <CardDescription>
                    {recentOrders.length > 0 ? `${recentOrders.length} commandes récentes` : "Aucune commande récente"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.slice(0, 5).map((order) => (
                      <div key={order.orderId} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {order.orderId}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="ml-auto font-medium">€{(Number(order.amount) || 0).toFixed(2)}</div>
                      </div>
                    ))}
                    {recentOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune commande récente à afficher.</p>
                    )}
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
                  <BakeriesComparisonChart data={bakeryData} />
                </CardContent>
              </Card>
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle>Indicateurs de Performance</CardTitle>
                  <CardDescription>Évolution des KPIs principaux</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {performanceIndicators.map((item, i) => (
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
                        id: 'sales',
                        title: "Rapport mensuel des ventes", 
                        description: "Analyse détaillée des ventes du mois par produit et boulangerie", 
                        date: new Date().toLocaleDateString('fr-FR'), 
                        status: "Prêt" 
                      },
                      { 
                        id: 'products',
                        title: "Rapport de performance des produits", 
                        description: "Analyse des ventes et performances par produit", 
                        date: new Date().toLocaleDateString('fr-FR'), 
                        status: "Prêt" 
                      },
                      { 
                        id: 'financial',
                        title: "Rapport financier trimestriel", 
                        description: "États financiers et chiffre d'affaires par boulangerie", 
                        date: new Date().toLocaleDateString('fr-FR'), 
                        status: "Prêt" 
                      }
                    ].map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-base">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{report.date}</p>
                            <p className={`text-xs ${report.status === "Prêt" ? "text-emerald-500" : "text-amber-500"}`}>{report.status}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(report.id as 'sales' | 'products' | 'financial')}
                            disabled={exportLoading === report.id}
                          >
                            {exportLoading === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Facturation Hebdomadaire
                  </CardTitle>
                  <CardDescription>
                    Générez des factures Excel par boulangerie pour une semaine donnée. Chaque boulangerie aura sa propre feuille dans le fichier Excel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Date de début</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={weeklyBillingDates.startDate}
                        onChange={(e) => setWeeklyBillingDates(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Date de fin</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={weeklyBillingDates.endDate}
                        onChange={(e) => setWeeklyBillingDates(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleWeeklyBillingExport}
                        disabled={weeklyBillingLoading || !weeklyBillingDates.startDate || !weeklyBillingDates.endDate}
                        className="w-full"
                      >
                        {weeklyBillingLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Générer Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Raccourcis rapides</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeeklyBillingDates(getCurrentWeekDates())}
                      >
                        Semaine actuelle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeeklyBillingDates(getPreviousWeekDates())}
                      >
                        Semaine précédente
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">ℹ️ À propos de la facturation hebdomadaire</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Le fichier Excel généré contiendra une feuille séparée pour chaque boulangerie avec les détails de toutes leurs commandes pour la période sélectionnée. 
                      Une feuille de résumé général sera également incluse. Ce fichier peut être imprimé et remis physiquement aux boulangeries pour le paiement.
                    </p>
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
