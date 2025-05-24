// components/products/product-filters.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { ProductFilters, ProductFiltersProps } from '@/types/product';

export function ProductFiltersComponent({ 
  filters, 
  onFiltersChange, 
  categories, 
  isLoading = false 
}: ProductFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Update search input when filters change externally
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchInput('');
    onFiltersChange({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false;
    return value !== undefined && value !== '' && value !== 'all';
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={isLoading || activeFiltersCount === 0}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Moins' : 'Plus'} de filtres
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, description ou ingrédients..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  <span className="capitalize">{category}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select
            value={filters.sortBy || 'createdAt'}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>            <SelectContent>
              <SelectItem value="createdAt">Date création</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="unitPrice">Prix</SelectItem>
              <SelectItem value="category">Catégorie</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder || 'desc'}
            onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Décroissant</SelectItem>
              <SelectItem value="asc">Croissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Status Filter */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-filter"
                  checked={filters.active === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('active', checked ? true : undefined)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="active-filter" className="text-sm font-medium">
                  Produits actifs uniquement
                </Label>
              </div>

              {/* Available Status Filter */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="available-filter"
                  checked={filters.available === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('available', checked ? true : undefined)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="available-filter" className="text-sm font-medium">
                  Disponibles uniquement
                </Label>
              </div>

              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="limit-select" className="text-sm font-medium whitespace-nowrap">
                  Par page:
                </Label>
                <Select
                  value={filters.limit?.toString() || '20'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[80px]" id="limit-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtres actifs:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Recherche: "{filters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setSearchInput('');
                    handleFilterChange('search', undefined);
                  }}
                />
              </Badge>
            )}
            
            {filters.category && (
              <Badge variant="secondary" className="gap-1 capitalize">
                Catégorie: {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('category', undefined)}
                />
              </Badge>
            )}
            
            {filters.active === true && (
              <Badge variant="secondary" className="gap-1">
                Actifs uniquement
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('active', undefined)}
                />
              </Badge>
            )}
            
            {filters.available === true && (
              <Badge variant="secondary" className="gap-1">
                Disponibles uniquement
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('available', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
