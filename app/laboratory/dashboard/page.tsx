"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, Clock, Download, Printer, Filter, Search, Calendar as CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { BakeryRecapTable } from "@/components/bakery-recap-table"
import { generateExcelFile, downloadExcel, printExcel } from "@/lib/excel-export"
import type { Order, OrderProduct } from "@/types/order"
import { format, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { priceVisible } from "@/lib/config"

export default function LaboratoryDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userLabName, setUserLabName] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/orders")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setOrders(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLaboratoryInfo = async () => {
    try {
      const userInfoString = localStorage.getItem("userInfo")
      if (!userInfoString) return null

      const userInfo = JSON.parse(userInfoString)
      if (userInfo && userInfo.labName) {
        setUserLabName(userInfo.labName)
        return userInfo.labName   // ⬅️ return it
      }

      return null
    } catch (error) {
      console.error("Error:", error)
      return null
    }
  }


  useEffect(() => {
    fetchLaboratoryInfo().then((lab) => {
      if (lab) fetchOrders()
    })
  }, [])


  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // Re-fetch orders to update the UI
      fetchOrders()
    } catch (e: any) {
      console.error("Failed to update order status:", e)
      setError("Failed to update order status: " + e.message)
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by labName first
    const matchesLab = userLabName ? order.products.some((product) => product.laboratory === userLabName) : true

    // Then apply search term filter
    const matchesSearchTerm =
      order.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some((product) => product.productName.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by selected date
    const orderDate = new Date(order.scheduledDate)
    const matchesDate = selectedDate
      ? orderDate.getDate() === selectedDate.getDate() &&
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getFullYear() === selectedDate.getFullYear()
      : true

    return matchesLab && matchesSearchTerm && matchesDate
  })

  const pendingOrders = filteredOrders.filter((order) => order.status === "PENDING")
  const inProductionOrders = filteredOrders.filter((order) => order.status === "IN_PROGRESS")
  const readyForDeliveryOrders = filteredOrders.filter((order) => order.status === "READY_FOR_DELIVERY")

  const productTotals = pendingOrders.reduce(
    (acc, order) => {
      order.products.forEach((product) => {
        if (!acc[product.productName]) {
          acc[product.productName] = {
            productName: product.productName,
            productRef: product.productRef,
            totalQuantity: 0,
          }
        }
        acc[product.productName].totalQuantity += product.quantity
      })
      return acc
    },
    {} as Record<string, { productName: string; productRef?: string; totalQuantity: number }>,
  )

  const productTotalsArray = Object.values(productTotals).sort((a, b) => a.productName.localeCompare(b.productName))


  const handleBulkComplete = async () => {
    setIsBulkUpdating(true)
    try {
      // Create an array of promises to update all orders in parallel
      const ordersToUpdate = [...pendingOrders, ...inProductionOrders]
      const updatePromises = ordersToUpdate.map(order =>
        updateOrderStatus(order._id, "READY_FOR_DELIVERY")
      )

      await Promise.all(updatePromises)

    } catch (error) {
      console.error("Error in bulk update:", error)
      setError("Erreur lors de la mise à jour massive")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const buffer = await generateExcelFile(filteredOrders, userLabName, pendingOrders, productTotalsArray)
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : new Date().toISOString().split("T")[0]
      const filename = `production_report_${dateStr}.xlsx`
      downloadExcel(buffer, filename)
    } catch (error) {
      console.error("Error exporting Excel:", error)
      setError("Erreur lors de l'export Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrintExcel = async () => {
    setIsExporting(true)
    try {
      const buffer = await generateExcelFile(filteredOrders, userLabName, pendingOrders, productTotalsArray)
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : new Date().toISOString().split("T")[0]
      const filename = `production_report_${dateStr}.xlsx`
      printExcel(buffer, filename)
    } catch (error) {
      console.error("Error printing Excel:", error)
      setError("Erreur lors de l'impression")
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex flex-col gap-4">
          <p>Loading orders...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex flex-col gap-4">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={fetchOrders}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{userLabName || "Laboratoire Central"}</h1>
            <p className="text-muted-foreground">
              Tableau de production du{" "}
              {selectedDate
                ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                : "Toutes les dates"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="w-full md:w-[200px] pl-8 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(new Date(), 1))}
              className={cn(
                "h-10",
                selectedDate &&
                  format(selectedDate, "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : ""
              )}
            >
              Demain
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 bg-transparent"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={handlePrintExcel}
              disabled={isExporting}
              className="flex items-center gap-2 bg-transparent"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Imprimer
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
              <div className="text-3xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">En production</CardTitle>
              <CardDescription>Commandes en cours de préparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{inProductionOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Terminées</CardTitle>
              <CardDescription>Commandes prêtes pour livraison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{readyForDeliveryOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mt-4">Récapitulatif des commandes</h2>
        <BakeryRecapTable orders={filteredOrders} />

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
              {productTotalsArray.length > 0 && (
                <div className="p-4 bg-muted/50 border-b">
                  <h4 className="font-semibold mb-3 text-sm">Total par produit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {productTotalsArray.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background rounded-md p-3 border">
                        <span className="text-sm font-medium truncate mr-2">{product.productName}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {product.totalQuantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="divide-y">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            Livraison:{" "}
                            {new Date(order.scheduledDate).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{product.productName}</span>
                            <span className="font-medium">x{product.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => updateOrderStatus(order._id, "IN_PROGRESS")}>
                          Démarrer la production <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande à produire.</p>
                )}
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">En cours</Badge>
                  {(pendingOrders.length > 0 || inProductionOrders.length > 0) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="default" disabled={isBulkUpdating}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Tout terminer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la validation massive</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir marquer ces {pendingOrders.length + inProductionOrders.length} commandes comme prêtes pour livraison ?
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkComplete}>
                            {isBulkUpdating ? "Traitement..." : "Confirmer"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {inProductionOrders.length > 0 ? (
                  inProductionOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Démarré il y a {Math.floor(Math.random() * 60)} min</span> {/* Mock time */}
                        </div>
                      </div>
                      <div className="space-y-3 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {product.productName} (x{product.quantity})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => updateOrderStatus(order._id, "READY_FOR_DELIVERY")}>
                          Terminer <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande en production.</p>
                )}
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
                {readyForDeliveryOrders.length > 0 ? (
                  readyForDeliveryOrders.map((order) => (
                    <div key={order._id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Commande #{order.orderReferenceId}</h3>
                          <p className="text-sm text-muted-foreground">{order.bakeryName}</p>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Terminé il y a {Math.floor(Math.random() * 30)} min</span> {/* Mock time */}
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {order.products.map((product: OrderProduct, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{product.productName}</span>
                            <span className="font-medium">x{product.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end"></div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground">Aucune commande prêtes pour livraison.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout >
  )
}
