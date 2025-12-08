"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OrderProduct {
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
}

interface Order {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  actualDeliveryDate: string | null
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DELIVERED"
  notes?: string
  address: string
  products: OrderProduct[]
  orderTotalHT: number
  orderTaxAmount: number
  orderTotalTTC: number
  createdAt: string
  updatedAt: string
}

interface BakeryRecapTableProps {
  orders: Order[]
}

export function BakeryRecapTable({ orders }: BakeryRecapTableProps) {
  const pendingOrders = orders.filter((order) => order.status === "PENDING")

  const bakeryData = pendingOrders.reduce(
    (acc, order) => {
      if (!acc[order.bakeryName]) {
        acc[order.bakeryName] = {
          bakeryName: order.bakeryName,
          orderCount: 0,
          articleCount: 0,
          totalAmount: 0,
          products: {} as Record<string, number>,
        }
      }

      acc[order.bakeryName].orderCount += 1
      acc[order.bakeryName].totalAmount += order.orderTotalTTC

      order.products.forEach((product) => {
        acc[order.bakeryName].articleCount += 1
        if (!acc[order.bakeryName].products[product.productName]) {
          acc[order.bakeryName].products[product.productName] = 0
        }
        acc[order.bakeryName].products[product.productName] += product.quantity
      })

      return acc
    },
    {} as Record<
      string,
      {
        bakeryName: string
        orderCount: number
        articleCount: number
        totalAmount: number
        products: Record<string, number>
      }
    >,
  )

  const bakeryArray = Object.values(bakeryData).sort((a, b) => a.bakeryName.localeCompare(b.bakeryName))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes en attente de production</CardTitle>
        <CardDescription>Récapitulatif des commandes avec statut "À produire" par boulangerie</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {bakeryArray.length > 0 ? (
            bakeryArray.map((bakery) => (
              <div key={bakery.bakeryName} className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{bakery.bakeryName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bakery.orderCount} commande{bakery.orderCount > 1 ? "s" : ""} • {bakery.articleCount} article
                    {bakery.articleCount > 1 ? "s" : ""} • Total:{" "}
                    {bakery.totalAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Articles à produire</h4>
                  <div className="overflow-x-auto">
                    <Table className="text-sm">
                      <TableHeader>
                        <TableRow className="border-0">
                          <TableHead className="h-8 px-2">Produit</TableHead>
                          <TableHead className="h-8 px-2 text-right font-semibold">Quantité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(bakery.products)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([productName, quantity]) => (
                            <TableRow key={productName} className="border-0 hover:bg-background/50">
                              <TableCell className="px-2 py-1.5 font-medium">{productName}</TableCell>
                              <TableCell className="px-2 py-1.5 text-right">
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{quantity}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Aucune commande en attente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
