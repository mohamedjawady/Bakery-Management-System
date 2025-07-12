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
import { Upload, X, Loader2, Clock, Euro, Building2, Percent } from "lucide-react"
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
      taxRate: 0.15, // Default 15% VAT
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
        taxRate: product.taxRate || 0.15, // Default to 15% if not set
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
        taxRate: 0.15, // Default 15% VAT
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
        console.log("laboratories",laboratories);
    const lab = laboratories.find((l) => l.labName === laboratory)

    
    return lab ? lab.labName : laboratory
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalTitle()}
            {product && mode === "view" && (
              <div className="flex gap-2 ml-auto">
                {!product.active && <Badge variant="destructive">Inactif</Badge>}
                {!product.isAvailable && product.active && <Badge variant="outline">Non disponible</Badge>}
                {product.active && product.isAvailable && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Disponible
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "view" && "Informations détaillées du produit"}
            {mode === "edit" && "Modifiez les informations du produit"}
            {mode === "create" && "Créez un nouveau produit pour votre catalogue"}
          </DialogDescription>
        </DialogHeader>

        {mode === "view" ? (
          // View Mode - Display Only
          <div className="space-y-6">
            {/* Product Image */}
            {product?.image && (
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                  <p className="text-lg font-semibold">{product?.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Laboratoire</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{getLaboratoryName(product?.laboratory || "")}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Informations de prix</Label>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Prix HT:</span>
                      <span className="font-semibold">{product && formatPrice(product.unitPrice)}</span>
                    </div>
                    {product?.taxRate && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">TVA ({(product.taxRate * 100).toFixed(0)}%):</span>
                          <span className="font-medium">{product && formatPrice(product.unitPrice * product.taxRate)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-semibold">Prix TTC:</span>
                          <span className="text-lg font-bold text-green-600">
                            {product && formatPrice(product.unitPrice * (1 + product.taxRate))}
                          </span>
                        </div>
                      </>
                    )}
                    {!product?.taxRate && (
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-semibold">Prix TTC:</span>
                        <span className="text-lg font-bold text-green-600">{product && formatPrice(product.unitPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Catégorie</Label>
                  <Badge variant="secondary" className="capitalize">
                    {product?.category || "Général"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <div className="flex gap-2">
                    <Badge variant={product?.active ? "default" : "destructive"}>
                      {product?.active ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant={product?.isAvailable ? "default" : "outline"}>
                      {product?.isAvailable ? "Disponible" : "Non disponible"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{product?.description}</p>
            </div>

            {/* Ingredients */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Ingrédients</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {product?.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            {product?.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 italic">{product.notes}</p>
              </div>
            )}

            {/* Creation/Update Info */}
            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <p>Créé le {product && new Date(product.createdAt).toLocaleString("fr-FR")}</p>
              {product?.createdBy && <p>par {product.createdBy}</p>}
              {product?.updatedAt !== product?.createdAt && (
                <>
                  <p>Modifié le {product && new Date(product.updatedAt).toLocaleString("fr-FR")}</p>
                  {product?.updatedBy && <p>par {product.updatedBy}</p>}
                </>
              )}
            </div>
          </div>
        ) : (
          // Edit/Create Mode - Form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image du produit</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Aperçu"
                        width={200}
                        height={150}
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
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
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez une image ou cliquez pour parcourir
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                  {imageError && <p className="text-sm text-destructive mt-2">{imageError}</p>}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Baguette tradition" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Updated Laboratory Field with Select */}
                <FormField
                  control={form.control}
                  name="laboratory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratoire *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      {laboratoriesError && (
                        <p className="text-xs text-muted-foreground">
                          Impossible de charger les laboratoires. Vérifiez votre connexion.
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => {
                    const watchedPrice = form.watch("unitPrice");
                    const watchedTaxRate = form.watch("taxRate") || 0.15;
                    const priceTTC = watchedPrice * (1 + watchedTaxRate);
                    const taxAmount = watchedPrice * watchedTaxRate;
                    
                    return (
                      <FormItem>
                        <FormLabel>Prix unitaire HT (€) *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="relative">
                              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            {watchedPrice > 0 && (
                              <div className="text-sm text-muted-foreground space-y-1 p-2 bg-muted/50 rounded">
                                <div className="flex justify-between">
                                  <span>Prix HT:</span>
                                  <span className="font-medium">{watchedPrice.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>TVA ({(watchedTaxRate * 100).toFixed(0)}%):</span>
                                  <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                  <span className="font-semibold">Prix TTC:</span>
                                  <span className="font-semibold text-primary">{priceTTC.toFixed(2)} €</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de TVA (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="15.00"
                            {...field}
                            value={field.value ? (field.value * 100).toFixed(2) : ''}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) / 100 || 0.15)}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez votre produit..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingrédients *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Farine de blé, eau, levure, sel (séparés par des virgules)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de TVA (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="15"
                            className="pl-10"
                            value={field.value ? (field.value * 100).toFixed(2) : ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) / 100;
                              field.onChange(isNaN(value) ? undefined : value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes supplémentaires..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status switches */}
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Produit actif</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Disponible à la vente</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Créer" : "Sauvegarder"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
