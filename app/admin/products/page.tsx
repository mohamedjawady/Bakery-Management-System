"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2, LayoutGrid, List, FileDown, FileUp, Search, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

// Import our comprehensive components and types
import { ProductCard } from "@/components/products/product-card"
import { ProductFiltersComponent } from "@/components/products/product-filters"
import { ProductModal } from "@/components/products/product-modal"
import { ProductPagination } from "@/components/products/product-pagination"
import { Product, ProductFilters, ProductCreateInput, ProductUpdateInput } from "@/types/product"
import { getProducts, getProductCategories, createProduct, updateProduct, deleteProduct } from "@/lib/api/products"

// Enhanced admin product list view
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function AdminProductsPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  
  // Quick search state
  const [quickSearch, setQuickSearch] = useState('')
  
  // Filter state (admin sees all products by default)
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    available: undefined,
    active: undefined, // Admin can see both active and inactive
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  const { toast } = useToast()

  // Fetch products and categories
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchTerm = quickSearch || filters.search
      const [productsResponse, categoriesResponse] = await Promise.all([
        getProducts({
          ...filters,
          search: searchTerm,
          page: currentPage,
          limit: itemsPerPage
        }),
        getProductCategories()
      ])

      setProducts(productsResponse.data)
      setTotalProducts(productsResponse.pagination?.total || 0)
      setCategories(categoriesResponse)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Erreur lors du chargement des produits')
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchProducts()
  }, [currentPage, itemsPerPage, filters, quickSearch])

  // Handle filter changes
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    setQuickSearch('') // Clear quick search when using advanced filters
  }

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Modal handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  // Product CRUD operations
  const handleProductSave = async (productData: ProductCreateInput | ProductUpdateInput) => {
    try {
      if (modalMode === 'create') {
        await createProduct(productData as ProductCreateInput)
        toast({
          title: "Succès",
          description: "Produit créé avec succès",
        })
      } else if (modalMode === 'edit' && selectedProduct) {
        await updateProduct(selectedProduct._id, productData as ProductUpdateInput)
        toast({
          title: "Succès",
          description: "Produit modifié avec succès",
        })
      }
      
      // Refresh the products list
      fetchProducts()
      handleModalClose()
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: "Erreur",
        description: modalMode === 'create' ? "Impossible de créer le produit" : "Impossible de modifier le produit",
        variant: "destructive",
      })
    }
  }

  const handleProductDelete = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      return
    }

    try {
      await deleteProduct(product._id)
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      })
      
      // Refresh the products list
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      })
    }
  }

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }
  // Table row component for better organization
  const ProductTableRow = ({ product }: { product: Product }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {product.image && (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">{product.category}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={product.description}>
          {product.description}
        </div>
      </TableCell>
      <TableCell>{formatPrice(product.unitPrice)}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Badge variant={product.active ? "default" : "secondary"}>
            {product.active ? "Actif" : "Inactif"}
          </Badge>
          <Badge variant={product.isAvailable ? "default" : "destructive"}>
            {product.isAvailable ? "Disponible" : "Indisponible"}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(product.updatedAt)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleProductDelete(product)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Produits</h1>
            <p className="text-muted-foreground">
              Gérez le catalogue complet de produits de la boulangerie
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm">
              <FileUp className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.isAvailable).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Recherche rapide..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <ProductFiltersComponent
          categories={categories}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showAvailabilityFilter={true}
          showActiveFilter={true}
        />

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? "Chargement..." : `${totalProducts} produit${totalProducts > 1 ? 's' : ''}`}
            </CardTitle>
            {error && (
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Chargement des produits...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchProducts}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun produit trouvé</p>
                <Button 
                  onClick={handleCreateProduct}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le premier produit
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'table' ? (
                  <div className="rounded-md border">
                    <Table>                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Dernière MAJ</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <ProductTableRow key={product._id} product={product} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onView={handleViewProduct}
                        onEdit={handleEditProduct}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}                {/* Pagination */}
                <div className="mt-6">
                  <ProductPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalProducts / itemsPerPage)}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalProducts}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          product={selectedProduct}
          mode={modalMode}
          categories={categories}
          onSave={handleProductSave}
        />
      </div>
    </DashboardLayout>
  )
}
