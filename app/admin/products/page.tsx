"use client"

import { useEffect, useState } from "react"
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
import { Edit, Eye, Loader2, Plus, Search, Trash } from "lucide-react"
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

// API endpoint
const API_URL = "http://localhost:5000/Products"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
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
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch products from API
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits. Veuillez réessayer plus tard.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle product creation
  const handleCreateProduct = async () => {
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

    const createdProduct: Omit<Product, "id" | "createdAt"> = {
      name: newProduct.name,
      description: newProduct.description,
      ingredients: ingredientsArray,
      unitPrice: Number(newProduct.unitPrice),
      active: newProduct.active || true,
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createdProduct),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const savedProduct = await response.json()
      setProducts([...products, savedProduct])
      setNewProduct({
        name: "",
        description: "",
        ingredients: [],
        unitPrice: 0,
        active: true,
      })
      setIsCreateDialogOpen(false)
      toast({
        title: "Produit créé avec succès!",
        description: `Le produit "${savedProduct.name}" a été ajouté au catalogue.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error) {
      console.error("Failed to create product:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit. Veuillez réessayer plus tard.",
        variant: "destructive",
      })
    }
  }

  // Handle product update
  const handleUpdateProduct = async () => {
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

    try {
      const response = await fetch(`${API_URL}/${updatedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const savedProduct = await response.json()
      const updatedProducts = products.map((product) => (product.id === savedProduct.id ? savedProduct : product))
      setProducts(updatedProducts)
      setIsEditDialogOpen(false)
      toast({
        title: "Produit mis à jour avec succès!",
        description: `Le produit "${savedProduct.name}" a été mis à jour.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit. Veuillez réessayer plus tard.",
        variant: "destructive",
      })
    }
  }

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`${API_URL}/${productToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const updatedProducts = products.filter((product) => product.id !== productToDelete.id)
      setProducts(updatedProducts)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      toast({
        title: "Produit supprimé avec succès!",
        description: `Le produit "${productToDelete.name}" a été supprimé du catalogue.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit. Veuillez réessayer plus tard.",
        variant: "destructive",
      })
    }
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
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, ingredients: e.target.value.split(",").map((i) => i.trim()) })
                    }
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Chargement des produits...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
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
                              <DialogContent className="flex flex-col items-center">
                                <DialogHeader>
                                  <DialogTitle>Détails du produit</DialogTitle>
                                </DialogHeader>
                                {viewingProduct && (
                                  <div className="grid gap-4 py-4 text-center w-full max-w-md">
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
                                      <ul className="list-disc flex flex-col items-center">
                                        {viewingProduct.ingredients.map((ingredient, index) => (
                                          <li key={index} className="text-center">
                                            {ingredient}
                                          </li>
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
                                            ingredients: e.target.value.split(",").map((i) => i.trim()),
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
