"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileSpreadsheet, File } from 'lucide-react';
import { exportProductsWithFilters } from '@/lib/api/export';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  currentFilters?: any;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton({ 
  currentFilters = {}, 
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = ''
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv'>('excel');
  const [customTitle, setCustomTitle] = useState('Liste des Produits');
  const { toast } = useToast();

  const handleExport = async (format: 'excel' | 'csv', useCustomTitle: boolean = false) => {
    if (useCustomTitle) {
      setSelectedFormat(format);
      setShowTitleDialog(true);
      return;
    }

    setIsExporting(true);
    try {
      await exportProductsWithFilters(format, currentFilters);
      
      toast({
        title: "Export réussi",
        description: `Les produits ont été exportés au format ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'exportation.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    setIsExporting(true);
    try {
      await exportProductsWithFilters(selectedFormat, currentFilters, customTitle);
      
      toast({
        title: "Export réussi",
        description: `Les produits ont été exportés au format ${selectedFormat.toUpperCase()}.`,
      });
      
      setShowTitleDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'exportation.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFilterSummary = () => {
    const filters = [];
    if (currentFilters.search) filters.push(`Recherche: "${currentFilters.search}"`);
    if (currentFilters.category && currentFilters.category !== 'all') filters.push(`Catégorie: ${currentFilters.category}`);
    if (currentFilters.active !== undefined) filters.push(`Actif: ${currentFilters.active ? 'Oui' : 'Non'}`);
    if (currentFilters.available !== undefined) filters.push(`Disponible: ${currentFilters.available ? 'Oui' : 'Non'}`);
    
    return filters.length > 0 ? filters.join(', ') : 'Tous les produits';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            disabled={disabled || isExporting}
            className={className}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <div className="flex flex-col">
              <span>Excel (.xlsx)</span>
              <span className="text-xs text-muted-foreground">Tableau avec formules</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
            <File className="mr-2 h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span>CSV (.csv)</span>
              <span className="text-xs text-muted-foreground">Données tabulaires</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Avec titre personnalisé</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => handleExport('excel', true)} disabled={isExporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Excel personnalisé
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('csv', true)} disabled={isExporting}>
            <File className="mr-2 h-4 w-4 text-blue-600" />
            CSV personnalisé
          </DropdownMenuItem>
          
          {Object.keys(currentFilters).length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Filtres actifs: {getFilterSummary()}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personnaliser l'export</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du document</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Entrez un titre personnalisé..."
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
              <p><strong>Filtres:</strong> {getFilterSummary()}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTitleDialog(false)}
              disabled={isExporting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCustomExport}
              disabled={isExporting || !customTitle.trim()}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : selectedFormat === 'excel' ? (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              Exporter {selectedFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
