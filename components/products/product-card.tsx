// components/products/product-card.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Clock, Package, Star } from 'lucide-react';
import { Product, ProductCardProps } from '@/types/product';
import Image from 'next/image';

export function ProductCard({ 
  product, 
  onView, 
  onEdit, 
  onDelete, 
  showActions = true,
  role = 'bakery'
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Check if user can edit/delete based on role
  const canEdit = role === 'admin' || role === 'laboratory';
  const canDelete = role === 'admin';

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${!product.active ? 'opacity-60' : ''}`}>
      {/* Product Image */}
      {product.image && !imageError && (
        <div className="relative h-48 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Non disponible
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
            {product.productRef && (
              <div className="mt-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {product.productRef}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-sm font-semibold">
              {formatPrice(product.unitPrice)}
            </Badge>
            {product.category && (
              <Badge variant="secondary" className="text-xs capitalize">
                {product.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        {/* Pricing Information */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Prix HT:</span>
            <span className="font-medium">{formatPrice(product.unitPrice)}</span>
          </div>
          {product.taxRate && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">TVA ({(product.taxRate * 100).toFixed(0)}%):</span>
                <span className="text-xs">{formatPrice(product.unitPrice * product.taxRate)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-1">
                <span className="text-sm font-semibold">Prix TTC:</span>
                <span className="font-semibold text-primary">{formatPrice(product.unitPrice * (1 + product.taxRate))}</span>
              </div>
            </>
          )}
        </div>        {/* Key Information */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {product.ingredients.length > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{product.ingredients.length} ingrédients</span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {!product.active && (
            <Badge variant="destructive" className="text-xs">
              Inactif
            </Badge>
          )}
          {!product.isAvailable && product.active && (
            <Badge variant="outline" className="text-xs">
              Non disponible
            </Badge>
          )}
          {product.active && product.isAvailable && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Disponible
            </Badge>
          )}
        </div>

        {/* Ingredients Preview */}
        {product.ingredients.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Ingrédients:</p>
            <div className="flex flex-wrap gap-1">
              {product.ingredients.slice(0, 3).map((ingredient, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
              {product.ingredients.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{product.ingredients.length - 3} autres
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {product.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            {product.notes}
          </p>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView?.(product)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir
            </Button>
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(product)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onDelete?.(product)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Creation info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</p>
          {product.createdBy && (
            <p>par {product.createdBy}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
