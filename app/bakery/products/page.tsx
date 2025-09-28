"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2 } from "lucide-react"

// Import our new components and types
import { ProductCard } from "@/components/products/product-card"
import { ProductFiltersComponent } from "@/components/products/product-filters"
import { ProductModal } from "@/components/products/product-modal"
import { ProductPagination } from "@/components/products/product-pagination"
import { ExportButton } from "@/components/products/export-button"
import type { Product, ProductFilters } from "@/types/product"
import { getProducts, getProductCategories } from "@/lib/api/products"

export default function BakeryProductsPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalProducts, setTotalProducts] = useState(0)
  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: "",
    available: undefined,
    active: true, // Only show active products by default for bakery view
    sortBy: "name",
    sortOrder: "asc",
  })

  const { toast } = useToast()

  // Fetch products and categories
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const [productsResponse, categoriesResponse] = await Promise.all([
        getProducts({
          ...filters,
          page: currentPage,
          limit: itemsPerPage,
        }),
        getProductCategories(),
      ])

      setProducts(productsResponse.data)
      setTotalProducts(productsResponse.pagination?.total || 0)
      setCategories(categoriesResponse)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Erreur lors du chargement des produits")
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
  }, [currentPage, itemsPerPage, filters])

  // Handle filter changes
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  // Modal handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleProductSaved = () => {
    // Refresh the products list after save
    fetchProducts()
    handleModalClose()
    toast({
      title: "Succès",
      description: modalMode === "create" ? "Produit créé avec succès" : "Produit modifié avec succès",
    })
  }

  const handleProductDeleted = () => {
    // Refresh the products list after delete
    fetchProducts()
    handleModalClose()
    toast({
      title: "Succès",
      description: "Produit supprimé avec succès",
    })
  }
  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Catalogue de produits</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Consultez et gérez les produits de la boulangerie
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton currentFilters={filters} variant="outline" size="sm" disabled={loading} />
            <Button onClick={handleCreateProduct} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Nouveau produit</span>
            </Button>
          </div>
        </div>{" "}
        {/* Filters */}
        <ProductFiltersComponent filters={filters} categories={categories} onFiltersChange={handleFiltersChange} />
        {/* Products Content */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">Produits disponibles</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {loading
                    ? "Chargement..."
                    : `${totalProducts} produit${totalProducts !== 1 ? "s" : ""} trouvé${totalProducts !== 1 ? "s" : ""}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-2 sm:gap-0">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                <span className="sm:ml-2 text-sm sm:text-base">Chargement des produits...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-6 sm:py-8 border rounded-md px-4">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={fetchProducts} className="mt-4 bg-transparent">
                  Réessayer
                </Button>
              </div>
            )}

            {/* No Products State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-6 sm:py-8 border rounded-md px-4">
                <p>Aucun produit trouvé</p>
                <Button variant="outline" onClick={handleCreateProduct} className="mt-4 bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier produit
                </Button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onView={handleViewProduct}
                      onEdit={handleEditProduct} // Removed canEdit condition - always pass edit handler
                      showActions={true}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalProducts / itemsPerPage)}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalProducts}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </>
            )}
          </CardContent>
        </Card>{" "}
        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          product={selectedProduct}
          mode={modalMode}
          onSave={handleProductSaved}
        />
      </div>
    </DashboardLayout>
  )
}
