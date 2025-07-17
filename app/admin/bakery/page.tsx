"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Edit, Plus, Search, Trash, Loader2, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

// Define laboratory type
interface Laboratory {
  _id: string
  bakeryName: string
  headChef?: string
  address?: string
  phone?: string
  email?: string
  capacity?: number
  equipment?: Array<{
    name: string
    quantity: number
    status: "operational" | "maintenance" | "broken"
  }>
  hygieneRating?: "A" | "B" | "C" | "D" | "E"
  lastInspectionDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LaboratoryFormData {
  bakeryName: string
  headChef: string
  address: string
  phone: string
  email: string
  capacity?: number
  hygieneRating?: "A" | "B" | "C" | "D" | "E"
  lastInspectionDate: string
  isActive?: boolean
}

const API_BASE_URL = "http://localhost:5000/bakery"

const initialFormData: LaboratoryFormData = {
  bakeryName: "",
  headChef: "",
  address: "",
  phone: "",
  email: "",
  capacity: undefined,
  hygieneRating: undefined,
  lastInspectionDate: "",
}

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Selected items
  const [labToDelete, setLabToDelete] = useState<Laboratory | null>(null)
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null)
  const [viewingLab, setViewingLab] = useState<Laboratory | null>(null)
  const [newLab, setNewLab] = useState<LaboratoryFormData>(initialFormData)

  const { toast } = useToast()
  const router = useRouter()

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }, [])

  const handleAuthError = useCallback(() => {
    toast({
      title: "Session expirée",
      description: "Veuillez vous reconnecter.",
      variant: "destructive",
    })
    router.push("/login")
  }, [toast, router])

  // Fetch laboratories from API
  const fetchLaboratories = useCallback(async () => {
    const token = getToken()
    if (!token) {
      handleAuthError()
      return
    }

    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Failed to fetch laboratories")
      }

      const data = await response.json()
      setLaboratories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de récupérer la liste des boulangeries.",
        variant: "destructive",
      })
      setLaboratories([])
    }
  }, [getToken, handleAuthError, toast])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchLaboratories()
      setIsLoading(false)
    }
    loadData()
  }, [fetchLaboratories])

  // Filter laboratories based on search term
  const filteredLaboratories = laboratories.filter((lab) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      lab.bakeryName?.toLowerCase().includes(searchLower) ||
      lab.headChef?.toLowerCase().includes(searchLower) ||
      lab.address?.toLowerCase().includes(searchLower) ||
      lab.email?.toLowerCase().includes(searchLower)
    )
  })

  // Validate form data
  const validateFormData = (data: LaboratoryFormData): string | null => {
    if (!data.bakeryName?.trim()) {
      return "Le nom de la boulangerie est obligatoire."
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return "L'adresse email n'est pas valide."
    }
    if (data.capacity && data.capacity < 1) {
      return "La capacité doit être supérieure à 0."
    }
    return null
  }

  // Handle laboratory creation
  const handleCreateLaboratory = async () => {
    const validationError = validateFormData(newLab)
    if (validationError) {
      toast({
        title: "Erreur de validation",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const token = getToken()
    if (!token) {
      handleAuthError()
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        bakeryName: newLab.bakeryName.trim(),
        headChef: newLab.headChef?.trim() || "",
        address: newLab.address?.trim() || "",
        phone: newLab.phone?.trim() || "",
        email: newLab.email?.trim() || "",
        capacity: newLab.capacity || undefined,
        hygieneRating: newLab.hygieneRating || undefined,
        lastInspectionDate: newLab.lastInspectionDate || undefined,
      }

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(errorData.message || "Failed to create laboratory")
      }

      const result = await response.json()
      await fetchLaboratories()

      setNewLab(initialFormData)
      setIsCreateDialogOpen(false)

      toast({
        title: "boulangerie créé",
        description: result.message || `Le boulangerie ${payload.bakeryName} a été créé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le boulangerie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle laboratory update
  const handleUpdateLaboratory = async () => {
    if (!editingLab || !editingLab._id) return

    const formData: LaboratoryFormData = {
      bakeryName: editingLab.bakeryName || "",
      headChef: editingLab.headChef || "",
      address: editingLab.address || "",
      phone: editingLab.phone || "",
      email: editingLab.email || "",
      capacity: editingLab.capacity,
      hygieneRating: editingLab.hygieneRating,
      lastInspectionDate: editingLab.lastInspectionDate || "",
      isActive: editingLab.isActive,
    }

    const validationError = validateFormData(formData)
    if (validationError) {
      toast({
        title: "Erreur de validation",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const token = getToken()
    if (!token) {
      handleAuthError()
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        bakeryName: formData.bakeryName.trim(),
        headChef: formData.headChef?.trim() || "",
        address: formData.address?.trim() || "",
        phone: formData.phone?.trim() || "",
        email: formData.email?.trim() || "",
        capacity: formData.capacity || undefined,
        hygieneRating: formData.hygieneRating || undefined,
        lastInspectionDate: formData.lastInspectionDate || undefined,
        isActive: formData.isActive,
      }

      const response = await fetch(`${API_BASE_URL}/${editingLab._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(errorData.message || "Failed to update laboratory")
      }

      const result = await response.json()
      await fetchLaboratories()

      setIsEditDialogOpen(false)
      setEditingLab(null)

      toast({
        title: "boulangerie mis à jour",
        description: result.message || `Le boulangerie ${payload.bakeryName} a été mis à jour avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour le boulangerie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle laboratory deletion
  const handleDeleteLaboratory = async () => {
    if (!labToDelete || !labToDelete._id) return

    setIsSubmitting(true)
    const token = getToken()
    if (!token) {
      handleAuthError()
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${labToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(errorData.message || "Failed to delete laboratory")
      }

      const result = await response.json()
      await fetchLaboratories()

      setIsDeleteDialogOpen(false)
      setLabToDelete(null)

      toast({
        title: "boulangerie désactivé",
        description: result.message || `Le boulangerie ${labToDelete.bakeryName} a été désactivé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de désactivation",
        description: error.message || "Impossible de désactiver le boulangerie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Date invalide"
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch {
      return "Date invalide"
    }
  }

  // Format date for input helper
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // Get hygiene rating color
  const getHygieneRatingColor = (rating?: string) => {
    switch (rating) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      case "E":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Reset dialogs
  const resetDialogs = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsViewDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setEditingLab(null)
    setViewingLab(null)
    setLabToDelete(null)
    setNewLab(initialFormData)
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">boulangeries</h1>
            <p className="text-muted-foreground">Gérez les boulangeries et leurs informations</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading || isSubmitting}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau boulangerie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau boulangerie</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouveau boulangerie</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bakeryName">Nom de la boulangerie *</Label>
                  <Input
                    id="bakeryName"
                    value={newLab.bakeryName}
                    onChange={(e) => setNewLab({ ...newLab, bakeryName: e.target.value })}
                    placeholder="Nom de la boulangerie"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headChef">Chef de boulangerie</Label>
                  <Input
                    id="headChef"
                    value={newLab.headChef}
                    onChange={(e) => setNewLab({ ...newLab, headChef: e.target.value })}
                    placeholder="Nom du chef de boulangerie"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={newLab.address}
                    onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
                    placeholder="Adresse complète du boulangerie"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={newLab.phone}
                      onChange={(e) => setNewLab({ ...newLab, phone: e.target.value })}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLab.email}
                      onChange={(e) => setNewLab({ ...newLab, email: e.target.value })}
                      placeholder="email@boulangerie.fr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={newLab.capacity || ""}
                      onChange={(e) =>
                        setNewLab({ ...newLab, capacity: e.target.value ? Number.parseInt(e.target.value) : undefined })
                      }
                      placeholder="Capacité de production"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hygieneRating">Note d'hygiène</Label>
                    <Select
                      value={newLab.hygieneRating || ""}
                      onValueChange={(value) =>
                        setNewLab({ ...newLab, hygieneRating: value as "A" | "B" | "C" | "D" | "E" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une note" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A - Excellent</SelectItem>
                        <SelectItem value="B">B - Très bien</SelectItem>
                        <SelectItem value="C">C - Bien</SelectItem>
                        <SelectItem value="D">D - Satisfaisant</SelectItem>
                        <SelectItem value="E">E - À améliorer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastInspectionDate">Dernière inspection</Label>
                  <Input
                    id="lastInspectionDate"
                    type="date"
                    value={newLab.lastInspectionDate}
                    onChange={(e) => setNewLab({ ...newLab, lastInspectionDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetDialogs} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button onClick={handleCreateLaboratory} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des boulangeries</CardTitle>
            <CardDescription>{laboratories.length} boulangeries trouvés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un boulangerie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Chef</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Note d'hygiène</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                          Chargement des boulangeries...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLaboratories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? "Aucun boulangerie trouvé pour cette recherche" : "Aucun boulangerie trouvé"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLaboratories.map((lab) => (
                      <TableRow key={lab._id} className={!lab.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{lab.bakeryName || "Nom non défini"}</TableCell>
                        <TableCell>{lab.headChef || "Non assigné"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{lab.address || "Non renseignée"}</TableCell>
                        <TableCell>
                          {lab.hygieneRating ? (
                            <Badge className={getHygieneRatingColor(lab.hygieneRating)}>{lab.hygieneRating}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Non évalué</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lab.isActive ? (
                            <Badge variant="default">Actif</Badge>
                          ) : (
                            <Badge variant="outline">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(lab.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* View Dialog */}
                            <Dialog
                              open={isViewDialogOpen && viewingLab?._id === lab._id}
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (open) setViewingLab(lab)
                                else setViewingLab(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du boulangerie</DialogTitle>
                                  <DialogDescription>Informations complètes du boulangerie</DialogDescription>
                                </DialogHeader>
                                {viewingLab && (
                                  <div className="grid gap-6 py-4">
                                    <div className="grid gap-4">
                                      <h3 className="text-lg font-semibold">Informations générales</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Nom de la boulangerie</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.bakeryName || "Non défini"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Chef de boulangerie</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.headChef || "Non assigné"}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Adresse</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {viewingLab.address || "Non renseignée"}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Téléphone</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.phone || "Non renseigné"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Email</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.email || "Non renseigné"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid gap-4">
                                      <h3 className="text-lg font-semibold">Informations techniques</h3>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Capacité</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.capacity || "Non définie"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Note d'hygiène</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.hygieneRating ? (
                                              <Badge className={getHygieneRatingColor(viewingLab.hygieneRating)}>
                                                {viewingLab.hygieneRating}
                                              </Badge>
                                            ) : (
                                              "Non évalué"
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Dernière inspection</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.lastInspectionDate
                                              ? formatDate(viewingLab.lastInspectionDate)
                                              : "Aucune"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid gap-4">
                                      <h3 className="text-lg font-semibold">Informations système</h3>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Statut</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {viewingLab.isActive ? (
                                              <Badge variant="default">Actif</Badge>
                                            ) : (
                                              <Badge variant="outline">Inactif</Badge>
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Créé le</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {formatDate(viewingLab.createdAt)}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Modifié le</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {formatDate(viewingLab.updatedAt)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsViewDialogOpen(false)
                                      setViewingLab(null)
                                    }}
                                  >
                                    Fermer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Edit Dialog */}
                            <Dialog
                              open={isEditDialogOpen && editingLab?._id === lab._id}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open)
                                if (open) setEditingLab(lab)
                                else setEditingLab(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Modifier le boulangerie</DialogTitle>
                                  <DialogDescription>Modifiez les informations du boulangerie</DialogDescription>
                                </DialogHeader>
                                {editingLab && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-bakeryName">Nom de la boulangerie *</Label>
                                      <Input
                                        id="edit-bakeryName"
                                        value={editingLab.bakeryName || ""}
                                        onChange={(e) =>
                                          setEditingLab({
                                            ...editingLab,
                                            bakeryName: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-headChef">Chef de boulangerie</Label>
                                      <Input
                                        id="edit-headChef"
                                        value={editingLab.headChef || ""}
                                        onChange={(e) =>
                                          setEditingLab({
                                            ...editingLab,
                                            headChef: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-address">Adresse</Label>
                                      <Textarea
                                        id="edit-address"
                                        value={editingLab.address || ""}
                                        onChange={(e) =>
                                          setEditingLab({
                                            ...editingLab,
                                            address: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-phone">Téléphone</Label>
                                        <Input
                                          id="edit-phone"
                                          value={editingLab.phone || ""}
                                          onChange={(e) =>
                                            setEditingLab({
                                              ...editingLab,
                                              phone: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                          id="edit-email"
                                          type="email"
                                          value={editingLab.email || ""}
                                          onChange={(e) =>
                                            setEditingLab({
                                              ...editingLab,
                                              email: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-capacity">Capacité</Label>
                                        <Input
                                          id="edit-capacity"
                                          type="number"
                                          min="1"
                                          value={editingLab.capacity || ""}
                                          onChange={(e) =>
                                            setEditingLab({
                                              ...editingLab,
                                              capacity: e.target.value ? Number.parseInt(e.target.value) : undefined,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-hygieneRating">Note d'hygiène</Label>
                                        <Select
                                          value={editingLab.hygieneRating || ""}
                                          onValueChange={(value) =>
                                            setEditingLab({
                                              ...editingLab,
                                              hygieneRating: value as "A" | "B" | "C" | "D" | "E",
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une note" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="A">A - Excellent</SelectItem>
                                            <SelectItem value="B">B - Très bien</SelectItem>
                                            <SelectItem value="C">C - Bien</SelectItem>
                                            <SelectItem value="D">D - Satisfaisant</SelectItem>
                                            <SelectItem value="E">E - À améliorer</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-lastInspectionDate">Dernière inspection</Label>
                                        <Input
                                          id="edit-lastInspectionDate"
                                          type="date"
                                          value={formatDateForInput(editingLab.lastInspectionDate)}
                                          onChange={(e) =>
                                            setEditingLab({
                                              ...editingLab,
                                              lastInspectionDate: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-isActive">Statut</Label>
                                        <Select
                                          value={editingLab.isActive ? "true" : "false"}
                                          onValueChange={(value) =>
                                            setEditingLab({
                                              ...editingLab,
                                              isActive: value === "true",
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez un statut" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">Actif</SelectItem>
                                            <SelectItem value="false">Inactif</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditDialogOpen(false)
                                      setEditingLab(null)
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Annuler
                                  </Button>
                                  <Button onClick={handleUpdateLaboratory} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{" "}
                                    Enregistrer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Dialog */}
                            <Dialog
                              open={isDeleteDialogOpen && labToDelete?._id === lab._id}
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open)
                                if (open) setLabToDelete(lab)
                                else setLabToDelete(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isSubmitting || !lab.isActive}
                                  title={!lab.isActive ? "boulangerie déjà inactif" : "Désactiver"}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Désactiver</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmer la désactivation</DialogTitle>
                                  <DialogDescription>
                                    Êtes-vous sûr de vouloir désactiver le boulangerie{" "}
                                    <strong>{labToDelete?.bakeryName || "ce boulangerie"}</strong> ? Cette action peut
                                    être annulée en modifiant le statut du boulangerie.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsDeleteDialogOpen(false)
                                      setLabToDelete(null)
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDeleteLaboratory}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Désactiver
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
