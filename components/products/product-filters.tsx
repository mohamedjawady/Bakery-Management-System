// components/products/product-filters.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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
      sortOrder: 'desc',
      active: true // Reset to show only active products by default
    });
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false;
    return value !== undefined && value !== '' && value !== 'all';
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Filtres et recherche</span>
            <span className="xs:hidden">Filtres</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
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
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">Réinitialiser</span>
              <span className="xs:hidden">Reset</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">
                {isExpanded ? 'Moins' : 'Plus'} de filtres
              </span>
              <span className="xs:hidden">
                {isExpanded ? 'Moins' : 'Plus'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 text-sm sm:text-base"
            disabled={isLoading}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0"
              onClick={() => setSearchInput('')}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>

        {/* Quick Filters - Mobile Optimized */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2">
          {/* Category Filter */}
          <div className="w-full sm:w-auto">
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="Toutes..." />
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
          </div>

          {/* Sort Options - Mobile: Two columns */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <Select
              value={filters.sortBy || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Nom" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Décroissant</SelectItem>
                <SelectItem value="asc">Croissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
            <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
              {/* Active Status Filter */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-2 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-md sm:rounded-none">
                <Label htmlFor="active-filter" className="text-sm font-medium">
                  Produits actifs uniquement
                </Label>
                <Switch
                  id="active-filter"
                  checked={filters.active === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('active', checked ? true : undefined)
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Available Status Filter */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-2 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-md sm:rounded-none">
                <Label htmlFor="available-filter" className="text-sm font-medium">
                  Disponibles uniquement
                </Label>
                <Switch
                  id="available-filter"
                  checked={filters.available === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('available', checked ? true : undefined)
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Items per page */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-2 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-md sm:rounded-none">
                <Label htmlFor="limit-select" className="text-sm font-medium">
                  Par page:
                </Label>
                <Select
                  value={filters.limit?.toString() || '20'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[80px] text-sm" id="limit-select">
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
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs sm:text-sm text-muted-foreground">Filtres actifs:</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="hidden xs:inline">Recherche: "</span>
                  <span className="xs:hidden">"</span>
                  {filters.search.length > 15 ? `${filters.search.substring(0, 15)}...` : filters.search}"
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
                <Badge variant="secondary" className="gap-1 capitalize text-xs">
                  <span className="hidden xs:inline">Catégorie: </span>
                  {filters.category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('category', undefined)}
                  />
                </Badge>
              )}
              
              {filters.active === true && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="hidden xs:inline">Actifs uniquement</span>
                  <span className="xs:hidden">Actifs</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('active', undefined)}
                  />
                </Badge>
              )}
              
              {filters.available === true && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="hidden xs:inline">Disponibles uniquement</span>
                  <span className="xs:hidden">Disponibles</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('available', undefined)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}