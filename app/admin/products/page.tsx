"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Edit, Eye, Plus, Search, Trash } from "lucide-react"
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    ingredients: [],
    unitPrice: 0,
    active: true,
  })
  const { toast } = useToast()

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle product creation
  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.description || newProduct.unitPrice === undefined) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    // Parse ingredients from textarea
    const ingredientsArray = newProduct.ingredients
      ? typeof newProduct.ingredients === "string"
        ? (newProduct.ingredients as string).split(",").map((i) => i.trim())
        : newProduct.ingredients
      : []

    const createdProduct: Product = {
      id: `${products.length + 1}`,
      name: newProduct.name,
      description: newProduct.description,
      ingredients: ingredientsArray,
      unitPrice: Number(newProduct.unitPrice),
      active: newProduct.active || true,
      createdAt: new Date().toISOString(),
    }

    setProducts([...products, createdProduct])
    setNewProduct({
      name: "",
      description: "",
      ingredients: [],
      unitPrice: 0,
      active: true,
    })
    setIsCreateDialogOpen(false)
    toast({
      title: "Produit créé",
      description: `Le produit ${createdProduct.name} a été créé avec succès`,
    })
  }

  // Handle product update
  const handleUpdateProduct = () => {
    if (!editingProduct) return

    // Parse ingredients if it's a string
    const ingredientsArray =
      typeof editingProduct.ingredients === "string"
        ? (editingProduct.ingredients as string).split(",").map((i) => i.trim())
        : editingProduct.ingredients

    const updatedProduct = {
      ...editingProduct,
      ingredients: ingredientsArray,
    }

    const updatedProducts = products.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
    setProducts(updatedProducts)
    setIsEditDialogOpen(false)
    toast({
      title: "Produit mis à jour",
      description: `Le produit ${updatedProduct.name} a été mis à jour avec succès`,
    })
  }

  // Handle product deletion
  const handleDeleteProduct = () => {
    if (!productToDelete) return

    const updatedProducts = products.filter((product) => product.id !== productToDelete.id)
    setProducts(updatedProducts)
    setIsDeleteDialogOpen(false)
    setProductToDelete(null)
    toast({
      title: "Produit supprimé",
      description: `Le produit ${productToDelete.name} a été supprimé avec succès`,
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground">Gérez le catalogue de produits</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nouveau produit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau produit</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouveau produit</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nom du produit"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Description du produit"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ingredients">Ingrédients (séparés par des virgules)</Label>
                  <Textarea
                    id="ingredients"
                    value={
                      typeof newProduct.ingredients === "string"
                        ? newProduct.ingredients
                        : newProduct.ingredients?.join(", ")
                    }
                    onChange={(e) => setNewProduct({ ...newProduct, ingredients: e.target.value.split(',').map(i => i.trim()) })}
                    placeholder="Farine, Eau, Sel, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix unitaire (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: Number.parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="active">Actif</Label>
                  <Switch
                    id="active"
                    checked={newProduct.active}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateProduct}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Catalogue de produits</CardTitle>
            <CardDescription>{filteredProducts.length} produits trouvés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatPrice(product.unitPrice)}</TableCell>
                        <TableCell>
                          {product.active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(product.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={isViewDialogOpen && viewingProduct?.id === product.id}
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (open) setViewingProduct(product)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Détails du produit</DialogTitle>
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
                                    <div>
                                      <h3 className="font-medium">Statut</h3>
                                      <p>{viewingProduct.active ? "Actif" : "Inactif"}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Date de création</h3>
                                      <p>{formatDate(viewingProduct.createdAt)}</p>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isEditDialogOpen && editingProduct?.id === product.id}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open)
                                if (open) setEditingProduct(product)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier le produit</DialogTitle>
                                  <DialogDescription>Modifiez les informations du produit</DialogDescription>
                                </DialogHeader>
                                {editingProduct && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-name">Nom</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingProduct.name}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            name: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={editingProduct.description}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            description: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-ingredients">Ingrédients (séparés par des virgules)</Label>
                                      <Textarea
                                        id="edit-ingredients"
                                        value={
                                          typeof editingProduct.ingredients === "string"
                                            ? editingProduct.ingredients
                                            : editingProduct.ingredients.join(", ")
                                        }
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            ingredients: e.target.value.split(',').map(i => i.trim()),
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-price">Prix unitaire (€)</Label>
                                      <Input
                                        id="edit-price"
                                        type="number"
                                        step="0.01"
                                        value={editingProduct.unitPrice}
                                        onChange={(e) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            unitPrice: Number.parseFloat(e.target.value),
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor="edit-active">Actif</Label>
                                      <Switch
                                        id="edit-active"
                                        checked={editingProduct.active}
                                        onCheckedChange={(checked) =>
                                          setEditingProduct({
                                            ...editingProduct,
                                            active: checked,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Annuler
                                  </Button>
                                  <Button onClick={handleUpdateProduct}>Enregistrer</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isDeleteDialogOpen && productToDelete?.id === product.id}
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open)
                                if (open) setProductToDelete(product)
                                else setProductToDelete(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Supprimer</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmer la suppression</DialogTitle>
                                  <DialogDescription>
                                    Êtes-vous sûr de vouloir supprimer le produit{" "}
                                    <strong>{productToDelete?.name}</strong> ? Cette action est irréversible.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                    Annuler
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteProduct}>
                                    Supprimer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
