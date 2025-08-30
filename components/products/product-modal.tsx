"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Upload, X, Loader2, Clock, Euro, Building2, Percent, Package, FileText, ChefHat } from "lucide-react"
import type { ProductModalProps, ProductCreateInput, ProductUpdateInput } from "@/types/product"
import { uploadProductImage } from "@/lib/api/products"
import Image from "next/image"

// Laboratory interface
interface Laboratory {
  _id: string
  labName: string
  headChef?: string
  address?: string
  isActive: boolean
}

const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  description: z.string().min(1, "La description est requise").max(500, "La description est trop longue"),
  ingredients: z.string().min(1, "Les ingrédients sont requis"),
  unitPrice: z.number().min(0.01, "Le prix HT doit être supérieur à 0"),
  taxRate: z.number().min(0).max(1, "Le taux de TVA doit être entre 0 et 100%").optional(),
  laboratory: z.string().min(1, "Le laboratoire est requis"),
  category: z.string().optional(),
  notes: z.string().optional(),
  isAvailable: z.boolean().optional(),
  active: z.boolean().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// Product categories
const categories = [
  { value: "bread", label: "Pain" },
  { value: "pastry", label: "Pâtisserie" },
  { value: "cake", label: "Gâteau" },
  { value: "viennoiserie", label: "Viennoiserie" },
  { value: "sandwich", label: "Sandwich" },
  { value: "dessert", label: "Dessert" },
  { value: "general", label: "Général" },
]

export function ProductModal({ product, isOpen, onClose, mode, onSave }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // Laboratory state
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [laboratoriesLoading, setLaboratoriesLoading] = useState(false)
  const [laboratoriesError, setLaboratoriesError] = useState<string | null>(null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      ingredients: "",
      unitPrice: 0,
      taxRate: 0.06, // Default 15% VAT
      laboratory: "",
      category: "general",
      notes: "",
      isAvailable: true,
      active: true,
    },
  })

  // Get token helper
  const getToken = () => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }

  // Fetch laboratories from API
  const fetchLaboratories = async () => {
    setLaboratoriesLoading(true)
    setLaboratoriesError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token d'authentification manquant")
      }

      const response = await fetch("/api/laboratory-info", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des laboratoires")
      }

      const data = await response.json()
      // Filter only active laboratories
      const activeLaboratories = data.filter((lab: Laboratory) => lab.isActive)
      setLaboratories(activeLaboratories)
    } catch (error) {
      console.error("Error fetching laboratories:", error)
      setLaboratoriesError("Impossible de charger les laboratoires")
      setLaboratories([])
    } finally {
      setLaboratoriesLoading(false)
    }
  }

  // Fetch laboratories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLaboratories()
    }
  }, [isOpen])

  // Reset form when product or mode changes
  useEffect(() => {
    if (product && (mode === "edit" || mode === "view")) {
      form.reset({
        name: product.name,
        description: product.description,
        ingredients: product.ingredients.join(", "),
        unitPrice: product.unitPrice,
        taxRate: product.taxRate || 0.06, // Default to 15% if not set
        laboratory: product.laboratory || "",
        category: product.category || "general",
        notes: product.notes || "",
        isAvailable: product.isAvailable,
        active: product.active,
      })
      setImagePreview(product.image || null)
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        ingredients: "",
        unitPrice: 0,
        taxRate: 0.06, // Default 15% VAT
        laboratory: "",
        category: "general",
        notes: "",
        isAvailable: true,
        active: true,
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setImageError(null)
  }, [product, mode, form])

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setImageError(null)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Veuillez sélectionner un fichier image valide")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Le fichier est trop volumineux (max 5MB)")
      return
    }

    try {
      setImageFile(file)
      const base64 = await uploadProductImage(file)
      setImagePreview(base64)
    } catch (error) {
      setImageError("Erreur lors du chargement de l'image")
      console.error("Image upload error:", error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    if (mode === "view") return

    setIsLoading(true)
    try {
      const ingredientsArray = data.ingredients
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)

      const productData: ProductCreateInput | ProductUpdateInput = {
        name: data.name,
        description: data.description,
        ingredients: ingredientsArray,
        unitPrice: data.unitPrice,
        laboratory: data.laboratory,
        category: data.category,
        notes: data.notes || undefined,
        isAvailable: data.isAvailable,
        active: data.active,
        image: imagePreview || undefined,
      }

      await onSave?.(productData)
      onClose()
    } catch (error) {
      console.error("Error saving product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get modal title
  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Nouveau produit"
      case "edit":
        return "Modifier le produit"
      case "view":
        return "Détails du produit"
      default:
        return "Produit"
    }
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Get laboratory name by ID
  const getLaboratoryName = (laboratory: string) => {
    console.log("laboratories", laboratories)
    const lab = laboratories.find((l) => l.labName === laboratory)

    return lab ? lab.labName : laboratory
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {mode === "view" && "Informations détaillées du produit"}
                {mode === "edit" && "Modifiez les informations du produit"}
                {mode === "create" && "Créez un nouveau produit pour votre catalogue"}
              </DialogDescription>
            </div>
            {product && mode === "view" && (
              <div className="flex gap-2">
                {!product.active && (
                  <Badge variant="destructive" className="text-sm">
                    Inactif
                  </Badge>
                )}
                {!product.isAvailable && product.active && (
                  <Badge variant="outline" className="text-sm">
                    Non disponible
                  </Badge>
                )}
                {product.active && product.isAvailable && (
                  <Badge className="bg-primary text-primary-foreground text-sm">Disponible</Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {mode === "view" ? (
            // View Mode - Display Only
            <div className="space-y-8">
              {product?.image && (
                <div className="relative h-80 w-full rounded-xl overflow-hidden bg-muted/50 border border-border">
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Informations générales
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nom du produit</Label>
                        <p className="text-xl font-bold text-foreground mt-1">{product?.name}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Référence Produit</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                            {product?.productRef || "N/A"}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Laboratoire</Label>
                        <div className="flex items-center gap-3 mt-1 p-3 bg-muted/50 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">
                            {getLaboratoryName(product?.laboratory || "")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Catégorie</Label>
                        <div className="mt-1">
                          <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                            {product?.category || "Général"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Statut</h3>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant={product?.active ? "default" : "destructive"} className="text-sm px-4 py-2">
                        {product?.active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant={product?.isAvailable ? "default" : "outline"} className="text-sm px-4 py-2">
                        {product?.isAvailable ? "Disponible" : "Non disponible"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Euro className="h-5 w-5 text-primary" />
                      Informations de prix
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Prix HT:</span>
                        <span className="text-lg font-semibold text-foreground">
                          {product && formatPrice(product.unitPrice)}
                        </span>
                      </div>
                      {product?.taxRate && (
                        <>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">TVA ({(product.taxRate * 100).toFixed(0)}%):</span>
                            <span className="font-medium text-foreground">
                              {product && formatPrice(product.unitPrice * product.taxRate)}
                            </span>
                          </div>
                          <div className="border-t border-border pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-foreground">Prix TTC:</span>
                              <span className="text-2xl font-bold text-primary">
                                {product && formatPrice(product.unitPrice * (1 + product.taxRate))}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      {!product?.taxRate && (
                        <div className="border-t border-border pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-foreground">Prix TTC:</span>
                            <span className="text-2xl font-bold text-primary">
                              {product && formatPrice(product.unitPrice)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    Description
                  </h3>
                  <p className="text-foreground leading-relaxed">{product?.description}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <ChefHat className="h-5 w-5 text-primary" />
                    Ingrédients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product?.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {product?.notes && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                  <p className="text-foreground leading-relaxed italic">{product.notes}</p>
                </div>
              )}

              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Créé le {product && new Date(product.createdAt).toLocaleString("fr-FR")}</span>
                    {product?.createdBy && <span>par {product.createdBy}</span>}
                  </div>
                  {product?.updatedAt !== product?.createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Modifié le {product && new Date(product.updatedAt).toLocaleString("fr-FR")}</span>
                      {product?.updatedBy && <span>par {product.updatedBy}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Edit/Create Mode - Form
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <Label className="text-lg font-semibold text-foreground mb-4 block">Image du produit</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 transition-colors hover:border-primary/50">
                    {imagePreview ? (
                      <div className="relative max-w-md mx-auto">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Aperçu"
                          width={300}
                          height={200}
                          className="rounded-lg object-cover w-full"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-3 right-3 shadow-lg"
                          onClick={() => {
                            setImagePreview(null)
                            setImageFile(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">
                          Glissez-déposez une image ou cliquez pour parcourir
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">Formats acceptés: JPG, PNG, GIF (max 5MB)</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                          }}
                          className="max-w-xs mx-auto"
                        />
                      </div>
                    )}
                    {imageError && <p className="text-sm text-destructive mt-4 text-center">{imageError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Informations générales
                    </h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Nom du produit *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Baguette tradition" className="h-12 text-base" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="laboratory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Laboratoire *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue
                                  placeholder={
                                    laboratoriesLoading
                                      ? "Chargement..."
                                      : laboratoriesError
                                        ? "Erreur de chargement"
                                        : "Sélectionnez un laboratoire"
                                  }
                                >
                                  {field.value && laboratories.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      <span>{getLaboratoryName(field.value)}</span>
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {laboratoriesLoading ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span className="text-sm">Chargement...</span>
                                </div>
                              ) : laboratoriesError ? (
                                <div className="flex flex-col items-center justify-center py-4 px-2">
                                  <span className="text-sm text-destructive mb-2">{laboratoriesError}</span>
                                  <Button type="button" variant="outline" size="sm" onClick={fetchLaboratories}>
                                    Réessayer
                                  </Button>
                                </div>
                              ) : laboratories.length === 0 ? (
                                <div className="text-center py-4 px-2">
                                  <span className="text-sm text-muted-foreground">Aucun laboratoire actif trouvé</span>
                                </div>
                              ) : (
                                laboratories.map((lab) => (
                                  <SelectItem key={lab.labName} value={lab.labName}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{lab.labName}</span>
                                        {lab.headChef && (
                                          <span className="text-xs text-muted-foreground">Chef: {lab.headChef}</span>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Euro className="h-5 w-5 text-primary" />
                      Informations de prix
                    </h3>

                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => {
                        const watchedPrice = form.watch("unitPrice")
                        const watchedTaxRate = form.watch("taxRate") || 0.06
                        const priceTTC = watchedPrice * (1 + watchedTaxRate)
                        const taxAmount = watchedPrice * watchedTaxRate

                        return (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Prix unitaire HT (€) *</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="relative">
                                  <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="pl-12 h-12 text-base"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                {watchedPrice > 0 && (
                                  <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span>Prix HT:</span>
                                      <span className="font-medium">{watchedPrice.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>TVA ({(watchedTaxRate * 100).toFixed(0)}%):</span>
                                      <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2">
                                      <span className="font-semibold">Prix TTC:</span>
                                      <span className="font-bold text-primary text-lg">{priceTTC.toFixed(2)} €</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Taux de TVA (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="6.00"
                                className="pr-12 h-12 text-base"
                                {...field}
                                value={field.value ? (field.value * 100).toFixed(2) : ""}
                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value) / 100 || 0.06)}
                              />
                              <Percent className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description and Ingredients */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-primary" />
                            Description *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez votre produit..."
                              className="min-h-[120px] text-base resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <FormField
                      control={form.control}
                      name="ingredients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <ChefHat className="h-5 w-5 text-primary" />
                            Ingrédients *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Farine de blé, eau, levure, sel (séparés par des virgules)"
                              className="min-h-[120px] text-base resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-foreground mb-4 block">
                          Notes (optionnel)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes supplémentaires..."
                            className="min-h-[100px] text-base resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Statut du produit</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Produit actif</FormLabel>
                            <p className="text-sm text-muted-foreground">Le produit apparaît dans le catalogue</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Disponible à la vente</FormLabel>
                            <p className="text-sm text-muted-foreground">Le produit peut être commandé</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>

        {mode !== "view" && (
          <DialogFooter className="pt-6 border-t border-border">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none h-12 text-base bg-transparent"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
                className="flex-1 sm:flex-none h-12 text-base font-semibold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Créer le produit" : "Sauvegarder"}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
