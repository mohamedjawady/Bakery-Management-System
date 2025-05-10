"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Eye, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Define product type
interface Product {
  id: string
  name: string
  description: string
  ingredients: string[]
  unitPrice: number
  active: boolean
  createdAt: string
}

// Sample data
const initialProducts: Product[] = [
  {
    id: "1",
    name: "Baguette Tradition",
    description: "Baguette traditionnelle à la française, croustillante et moelleuse",
    ingredients: ["Farine de blé", "Eau", "Levure", "Sel"],
    unitPrice: 1.2,
    active: true,
    createdAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Pain au Chocolat",
    description: "Viennoiserie feuilletée au beurre avec deux barres de chocolat",
    ingredients: ["Farine de blé", "Beurre", "Chocolat", "Sucre", "Levure", "Lait", "Œufs"],
    unitPrice: 1.5,
    active: true,
    createdAt: "2025-01-16T09:45:00Z",
  },
  {
    id: "3",
    name: "Croissant",
    description: "Viennoiserie feuilletée au beurre en forme de croissant",
    ingredients: ["Farine de blé", "Beurre", "Sucre", "Levure", "Lait", "Œufs"],
    unitPrice: 1.3,
    active: true,
    createdAt: "2025-01-16T09:50:00Z",
  },
  {
    id: "4",
    name: "Pain aux Céréales",
    description: "Pain complet aux graines variées pour un petit-déjeuner équilibré",
    ingredients: [
      "Farine complète",
      "Graines de tournesol",
      "Graines de lin",
      "Graines de sésame",
      "Levure",
      "Eau",
      "Sel",
    ],
    unitPrice: 2.8,
    active: true,
    createdAt: "2025-01-17T08:30:00Z",
  },
  {
    id: "5",
    name: "Éclair au Chocolat",
    description: "Pâtisserie à la pâte à choux fourrée à la crème pâtissière au chocolat",
    ingredients: ["Farine", "Œufs", "Beurre", "Chocolat", "Lait", "Sucre", "Crème"],
    unitPrice: 2.5,
    active: false,
    createdAt: "2025-01-18T14:20:00Z",
  },
]

export default function BakeryProductsPage() {
  const [products] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.active &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalogue de produits</h1>
            <p className="text-muted-foreground">Consultez les produits disponibles pour commander</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Produits disponibles</CardTitle>
            <CardDescription>{filteredProducts.length} produits trouvés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 border rounded-md">Aucun produit trouvé</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant="outline" className="w-fit mt-1">
                        {formatPrice(product.unitPrice)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setViewingProduct(product)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>Détails du produit</DialogTitle>
              <DialogDescription>Informations détaillées sur le produit</DialogDescription>
            </DialogHeader>
            {viewingProduct && (
              <div className="grid gap-4 py-4">
                <div>
                  <h3 className="font-medium">Nom</h3>
                  <p>{viewingProduct.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p>{viewingProduct.description}</p>
                </div>
                <div>
                  <h3 className="font-medium">Ingrédients</h3>
                  <ul className="list-disc pl-5">
                    {viewingProduct.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">Prix unitaire</h3>
                  <p>{formatPrice(viewingProduct.unitPrice)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
