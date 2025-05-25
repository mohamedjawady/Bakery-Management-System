// components/products/product-modal.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, X, Loader2, Clock, Package, Euro, FileText } from 'lucide-react';
import { ProductModalProps, ProductCreateInput, ProductUpdateInput } from '@/types/product';
import { uploadProductImage } from '@/lib/api/products';
import Image from 'next/image';

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().min(1, 'La description est requise').max(500, 'La description est trop longue'),
  ingredients: z.string().min(1, 'Les ingrédients sont requis'),
  unitPrice: z.number().min(0.01, 'Le prix doit être supérieur à 0'),
  category: z.string().optional(),
  notes: z.string().optional(),
  preparationTime: z.number().min(0, 'Le temps de préparation ne peut pas être négatif').optional(),
  isAvailable: z.boolean().optional(),
  active: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Product categories
const categories = [
  { value: 'bread', label: 'Pain' },
  { value: 'pastry', label: 'Pâtisserie' },
  { value: 'cake', label: 'Gâteau' },
  { value: 'viennoiserie', label: 'Viennoiserie' },
  { value: 'sandwich', label: 'Sandwich' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'general', label: 'Général' },
];

export function ProductModal({ product, isOpen, onClose, mode, onSave }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      ingredients: '',
      unitPrice: 0,
      category: 'general',
      notes: '',
      preparationTime: undefined,
      isAvailable: true,
      active: true,
    },
  });
  // Reset form when product or mode changes
  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      form.reset({
        name: product.name,
        description: product.description,
        ingredients: product.ingredients.join(', '),
        unitPrice: product.unitPrice,
        category: product.category || 'general',
        notes: product.notes || '',
        preparationTime: product.preparationTime || undefined,
        isAvailable: product.isAvailable,
        active: product.active,
      });
      setImagePreview(product.image || null);
    } else if (mode === 'create') {
      form.reset({
        name: '',
        description: '',
        ingredients: '',
        unitPrice: 0,
        category: 'general',
        notes: '',
        preparationTime: undefined,
        isAvailable: true,
        active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setImageError(null);
  }, [product, mode, form]);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setImageError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Veuillez sélectionner un fichier image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Le fichier est trop volumineux (max 5MB)');
      return;
    }

    try {
      setImageFile(file);
      const base64 = await uploadProductImage(file);
      setImagePreview(base64);
    } catch (error) {
      setImageError('Erreur lors du chargement de l\'image');
      console.error('Image upload error:', error);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    if (mode === 'view') return;

    setIsLoading(true);
    try {
      const ingredientsArray = data.ingredients
        .split(',')
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient.length > 0);      const productData: ProductCreateInput | ProductUpdateInput = {
        name: data.name,
        description: data.description,
        ingredients: ingredientsArray,
        unitPrice: data.unitPrice,
        category: data.category,
        notes: data.notes || undefined,
        preparationTime: data.preparationTime,
        isAvailable: data.isAvailable,
        active: data.active,
        image: imagePreview || undefined,
      };

      await onSave?.(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get modal title
  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Nouveau produit';
      case 'edit': return 'Modifier le produit';
      case 'view': return 'Détails du produit';
      default: return 'Produit';
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalTitle()}
            {product && mode === 'view' && (
              <div className="flex gap-2 ml-auto">
                {!product.active && (
                  <Badge variant="destructive">Inactif</Badge>
                )}
                {!product.isAvailable && product.active && (
                  <Badge variant="outline">Non disponible</Badge>
                )}
                {product.active && product.isAvailable && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Disponible
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' && 'Informations détaillées du produit'}
            {mode === 'edit' && 'Modifiez les informations du produit'}
            {mode === 'create' && 'Créez un nouveau produit pour votre catalogue'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' ? (
          // View Mode - Display Only
          <div className="space-y-6">
            {/* Product Image */}
            {product?.image && (
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
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
                  <Label className="text-sm font-medium text-muted-foreground">Prix unitaire</Label>
                  <p className="text-xl font-bold text-green-600">
                    {product && formatPrice(product.unitPrice)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Catégorie</Label>
                  <Badge variant="secondary" className="capitalize">
                    {product?.category || 'Général'}
                  </Badge>
                </div>
              </div>              <div className="space-y-4">
                {product?.preparationTime && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Temps de préparation</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{product.preparationTime} minutes</span>
                    </div>
                  </div>
                )}

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
              <p>Créé le {product && new Date(product.createdAt).toLocaleString('fr-FR')}</p>
              {product?.createdBy && <p>par {product.createdBy}</p>}
              {product?.updatedAt !== product?.createdAt && (
                <>
                  <p>Modifié le {product && new Date(product.updatedAt).toLocaleString('fr-FR')}</p>
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
                        src={imagePreview}
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
                          setImagePreview(null);
                          setImageFile(null);
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
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                  {imageError && (
                    <p className="text-sm text-destructive mt-2">{imageError}</p>
                  )}
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

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix unitaire (€) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre produit..."
                        className="min-h-[100px]"
                        {...field}
                      />
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
              />              {/* Additional Information */}
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
                  name="preparationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temps de préparation (min)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            placeholder="30"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                        placeholder="Informations complémentaires..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Switches */}
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Produit actif
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Disponible à la vente
                      </FormLabel>
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
                  {mode === 'create' ? 'Créer' : 'Sauvegarder'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
