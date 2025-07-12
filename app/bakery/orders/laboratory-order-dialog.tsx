"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Minus,
  Trash,
  Calendar,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Building2,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Types
interface Laboratory {
  _id: string
  labName: string
  headChef?: string
  address?: string
  phone?: string
  email?: string
  capacity?: number
  isActive: boolean
}

interface Product {
  _id: string
  name: string
  description: string
  laboratory: string
  ingredients: string[]
  unitPrice: number // Prix HT
  taxRate?: number // Taux de TVA
  unitPriceTTC?: number // Prix TTC
  taxAmount?: number // Montant de la taxe
  active: boolean
  category?: string
  image?: string
  isAvailable: boolean
}

interface OrderProduct {
  productName: string
  laboratory: string
  unitPriceHT: number // Prix unitaire HT
  unitPriceTTC: number // Prix unitaire TTC
  taxRate: number // Taux de TVA
  quantity: number
  totalPriceHT: number // Total HT pour ce produit
  taxAmount: number // Montant total de la taxe pour ce produit
  totalPriceTTC: number // Total TTC pour ce produit
}

interface LaboratoryOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateOrder: (orderData: any) => Promise<void>
  isSubmitting: boolean
}

export function LaboratoryOrderDialog({ isOpen, onClose, onCreateOrder, isSubmitting }: LaboratoryOrderDialogProps) {
  // Utility functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const calculateOrderTotals = () => {
    const totalHT = orderProducts.reduce((sum, item) => sum + item.totalPriceHT, 0);
    const totalTax = orderProducts.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalTTC = orderProducts.reduce((sum, item) => sum + item.totalPriceTTC, 0);
    
    return {
      totalHT: Number(totalHT.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalTTC: Number(totalTTC.toFixed(2))
    };
  };

  // State management
  const [currentStep, setCurrentStep] = useState<"laboratory" | "products" | "details">("laboratory")
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoadingLabs, setIsLoadingLabs] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Form data
  const [selectedLaboratory, setSelectedLaboratory] = useState<Laboratory | null>(null)
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([])
  const [bakeryName, setBakeryName] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())
  const [address, setAddress] = useState("")
  const [orderNotes, setOrderNotes] = useState("")

  // Fetch laboratories
  const fetchLaboratories = async () => {
    try {
      setIsLoadingLabs(true)
      const response = await fetch("/api/laboratories")

      if (!response.ok) {
        throw new Error("Failed to fetch laboratories")
      }

      const data = await response.json()
      const activeLabs = data.filter((lab: Laboratory) => lab.isActive)
      setLaboratories(activeLabs)
    } catch (error) {
      console.error("Error fetching laboratories:", error)
      // Fallback data for demo
      setLaboratories([
        {
          _id: "1",
          labName: "Laboratoire Central Paris",
          headChef: "Chef Martin",
          address: "123 Rue de la Boulangerie, Paris",
          isActive: true,
        },
        {
          _id: "2",
          labName: "Laboratoire Lyon Sud",
          headChef: "Chef Dubois",
          address: "456 Avenue des Pains, Lyon",
          isActive: true,
        },
        {
          _id: "3",
          labName: "Laboratoire Marseille",
          headChef: "Chef Moreau",
          address: "789 Boulevard des Croissants, Marseille",
          isActive: true,
        },
      ])
    } finally {
      setIsLoadingLabs(false)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await fetch("/api/products?active=true&available=true")

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.data || data)
    } catch (error) {
      console.error("Error fetching products:", error)
      // Fallback data for demo
      setProducts([
        {
          _id: "1",
          name: "Pain de Campagne",
          description: "Pain traditionnel français",
          laboratory: "Laboratoire Central Paris",
          ingredients: ["Farine", "Eau", "Sel", "Levure"],
          unitPrice: 3.5,
          active: true,
          category: "bread",
          isAvailable: true,
        },
        {
          _id: "2",
          name: "Croissant Beurre",
          description: "Croissant au beurre artisanal",
          laboratory: "Laboratoire Central Paris",
          ingredients: ["Farine", "Beurre", "Lait", "Œufs"],
          unitPrice: 1.2,
          active: true,
          category: "pastry",
          isAvailable: true,
        },
        {
          _id: "3",
          name: "Baguette Tradition",
          description: "Baguette française traditionnelle",
          laboratory: "Laboratoire Lyon Sud",
          ingredients: ["Farine T65", "Eau", "Sel", "Levure"],
          unitPrice: 1.1,
          active: true,
          category: "bread",
          isAvailable: true,
        },
        {
          _id: "4",
          name: "Pain au Chocolat",
          description: "Viennoiserie au chocolat",
          laboratory: "Laboratoire Lyon Sud",
          ingredients: ["Farine", "Beurre", "Chocolat", "Lait"],
          unitPrice: 1.3,
          active: true,
          category: "pastry",
          isAvailable: true,
        },
        {
          _id: "5",
          name: "Fougasse Olives",
          description: "Pain provençal aux olives",
          laboratory: "Laboratoire Marseille",
          ingredients: ["Farine", "Olives", "Huile d'olive", "Herbes"],
          unitPrice: 4.2,
          active: true,
          category: "bread",
          isAvailable: true,
        },
      ])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Filter products by selected laboratory
  useEffect(() => {
    if (selectedLaboratory && products.length > 0) {
      const filtered = products.filter((product) => product.laboratory === selectedLaboratory.labName)
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [selectedLaboratory, products])

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchLaboratories()
      fetchProducts()
    }
  }, [isOpen])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("laboratory")
      setSelectedLaboratory(null)
      setOrderProducts([])
      setBakeryName("")
      setScheduledDate(new Date())
      setAddress("")
      setOrderNotes("")
    }
  }, [isOpen])

  // Handle laboratory selection
  const handleLaboratorySelect = (laboratory: Laboratory) => {
    setSelectedLaboratory(laboratory)
    setCurrentStep("products")
  }

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItemIndex = orderProducts.findIndex((item) => item.productName === product.name)
    
    const taxRate = product.taxRate || 0.15; // Default 15% if not set
    const unitPriceTTC = product.unitPrice * (1 + taxRate);
    const taxAmountPerUnit = product.unitPrice * taxRate;

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderProducts]
      const newQuantity = updatedItems[existingItemIndex].quantity + 1;
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].totalPriceHT = updatedItems[existingItemIndex].unitPriceHT * newQuantity;
      updatedItems[existingItemIndex].taxAmount = updatedItems[existingItemIndex].unitPriceHT * taxRate * newQuantity;
      updatedItems[existingItemIndex].totalPriceTTC = updatedItems[existingItemIndex].totalPriceHT + updatedItems[existingItemIndex].taxAmount;
      setOrderProducts(updatedItems)
    } else {
      setOrderProducts([
        ...orderProducts,
        {
          productName: product.name,
          laboratory: product.laboratory,
          unitPriceHT: product.unitPrice,
          unitPriceTTC: unitPriceTTC,
          taxRate: taxRate,
          quantity: 1,
          totalPriceHT: product.unitPrice,
          taxAmount: taxAmountPerUnit,
          totalPriceTTC: unitPriceTTC,
        },
      ])
    }
  }

  // Update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedItems = [...orderProducts]
      updatedItems.splice(index, 1)
      setOrderProducts(updatedItems)
    } else {
      const updatedItems = [...orderProducts]
      updatedItems[index].quantity = newQuantity
      updatedItems[index].totalPriceHT = updatedItems[index].unitPriceHT * newQuantity
      updatedItems[index].taxAmount = updatedItems[index].unitPriceHT * updatedItems[index].taxRate * newQuantity
      updatedItems[index].totalPriceTTC = updatedItems[index].totalPriceHT + updatedItems[index].taxAmount
      setOrderProducts(updatedItems)
    }
  }

  // Remove item from order
  const removeItem = (index: number) => {
    const updatedItems = [...orderProducts]
    updatedItems.splice(index, 1)
    setOrderProducts(updatedItems)
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    return orderProducts.reduce((total, item) => total + item.totalPriceTTC, 0)
  }

  // Handle order submission
  const handleSubmit = async () => {
    if (!selectedLaboratory || orderProducts.length === 0 || !bakeryName || !scheduledDate || !address) {
      return
    }

    const orderData = {
      bakeryName,
      laboratory: selectedLaboratory.labName,
      scheduledDate: scheduledDate.toISOString(),
      address,
      notes: orderNotes,
      products: orderProducts,
    }

    await onCreateOrder(orderData)
  }

  // Render laboratory selection step
  const renderLaboratoryStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Sélectionnez un laboratoire</h3>
      </div>

      {isLoadingLabs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des laboratoires...</span>
        </div>
      ) : (
        <div className="grid gap-3">
          {laboratories.map((lab) => (
            <Card
              key={lab._id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleLaboratorySelect(lab)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{lab.labName}</h4>
                    {lab.headChef && <p className="text-sm text-muted-foreground">Chef: {lab.headChef}</p>}
                    {lab.address && <p className="text-xs text-muted-foreground">{lab.address}</p>}
                  </div>
                  <Badge variant="secondary">
                    {products.filter((p) => p.laboratory === lab.labName).length} produits
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Render products selection step
  const renderProductsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Produits disponibles</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep("laboratory")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Changer de laboratoire
        </Button>
      </div>

      {selectedLaboratory && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Laboratoire sélectionné: <strong>{selectedLaboratory.labName}</strong>
          </AlertDescription>
        </Alert>
      )}

      {isLoadingProducts ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des produits...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Aucun produit disponible pour ce laboratoire.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div>Prix HT: {formatPrice(product.unitPrice)}</div>
                        {product.taxRate && (
                          <>
                            <div>TVA ({(product.taxRate * 100).toFixed(0)}%): {formatPrice(product.unitPrice * product.taxRate)}</div>
                            <div className="font-medium">Prix TTC: {formatPrice(product.unitPrice * (1 + product.taxRate))}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => addProductToOrder(product)} className="ml-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order summary */}
      {orderProducts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Produits sélectionnés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderProducts.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.productName}</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>HT: {formatPrice(item.unitPriceHT)} × {item.quantity}</div>
                    <div>TVA ({(item.taxRate * 100).toFixed(0)}%): {formatPrice(item.taxAmount)}</div>
                    <div className="font-medium">TTC: {formatPrice(item.totalPriceTTC)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 bg-transparent"
                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 bg-transparent"
                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-medium ml-4">{formatPrice(item.totalPriceTTC)}</div>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span>Total HT:</span>
                <span>{formatPrice(calculateOrderTotals().totalHT)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total TVA:</span>
                <span>{formatPrice(calculateOrderTotals().totalTax)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-medium">Total TTC:</span>
                <span className="font-bold text-lg">{formatPrice(calculateOrderTotals().totalTTC)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => setCurrentStep("details")} disabled={orderProducts.length === 0}>
              Continuer vers les détails
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Render order details step
  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Détails de la commande</h3>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep("products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux produits
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="bakery">Nom de la boulangerie</Label>
          <Input
            id="bakery"
            placeholder="Nom de votre boulangerie"
            value={bakeryName}
            onChange={(e) => setBakeryName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="scheduledDate">Date de livraison prévue</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-transparent"
                id="scheduledDate"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, "PPP", { locale: fr }) : <span>Sélectionnez une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Adresse de livraison</Label>
        <Input
          id="address"
          placeholder="Adresse complète de livraison"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Instructions spéciales pour la commande..."
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Récapitulatif de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Laboratoire:</span>
            <span className="font-medium">{selectedLaboratory?.labName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Nombre de produits:</span>
            <span className="font-medium">{orderProducts.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Quantité totale:</span>
            <span className="font-medium">
              {orderProducts.reduce((total, item) => total + item.quantity, 0)} articles
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>{formatPrice(calculateTotalPrice())}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle commande</DialogTitle>
          <DialogDescription>
            {currentStep === "laboratory" && "Sélectionnez d'abord un laboratoire"}
            {currentStep === "products" && "Choisissez les produits à commander"}
            {currentStep === "details" && "Complétez les détails de votre commande"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${currentStep === "laboratory" ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "laboratory"
                      ? "border-primary bg-primary text-white"
                      : selectedLaboratory
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Laboratoire</span>
              </div>
              <div className="w-8 h-px bg-muted-foreground"></div>
              <div
                className={`flex items-center ${currentStep === "products" ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "products"
                      ? "border-primary bg-primary text-white"
                      : orderProducts.length > 0
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Produits</span>
              </div>
              <div className="w-8 h-px bg-muted-foreground"></div>
              <div
                className={`flex items-center ${currentStep === "details" ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "details" ? "border-primary bg-primary text-white" : "border-muted-foreground"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Détails</span>
              </div>
            </div>
          </div>

          {/* Step content */}
          {currentStep === "laboratory" && renderLaboratoryStep()}
          {currentStep === "products" && renderProductsStep()}
          {currentStep === "details" && renderDetailsStep()}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent">
            Annuler
          </Button>
          {currentStep === "details" && (
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedLaboratory ||
                orderProducts.length === 0 ||
                !bakeryName ||
                !scheduledDate ||
                !address ||
                isSubmitting
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Créer la commande
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
