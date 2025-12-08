"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OrderProduct {
  productName: string
  productRef?: string
  laboratory: string
  quantity: number
}

interface Order {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY" | "DELIVERED"
  products: OrderProduct[]
}

interface ProductTotal {
  productName: string
  productRef?: string
  totalQuantity: number
  orderCount: number
}

interface ProductTotalsTableProps {
  orders: Order[]
}

export function ProductTotalsTable({ orders }: ProductTotalsTableProps) {
  // Group products and calculate totals across all orders
  const productTotals = orders.reduce(
    (acc, order) => {
      order.products.forEach((product) => {
        if (!acc[product.productName]) {
          acc[product.productName] = {
            productName: product.productName,
            productRef: product.productRef,
            totalQuantity: 0,
            orderCount: 0,
          }
        }
        acc[product.productName].totalQuantity += product.quantity
        acc[product.productName].orderCount += 1
      })
      return acc
    },
    {} as Record<string, ProductTotal>,
  )

  // Convert to array and sort by product name
  const productTotalsArray = Object.values(productTotals).sort((a, b) => a.productName.localeCompare(b.productName))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total par produit</CardTitle>
        <CardDescription>Quantités totales de chaque produit commandé</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Quantité totale</TableHead>
                <TableHead className="text-center">Nombre de commandes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productTotalsArray.length > 0 ? (
                productTotalsArray.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {product.totalQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{product.orderCount}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Aucun produit à afficher
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
