"use client"

import { useState, useEffect } from "react"
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
  labName: string
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

const API_BASE_URL = "/api/laboratory-info"

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [labToDelete, setLabToDelete] = useState<Laboratory | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null)
  const [viewingLab, setViewingLab] = useState<Laboratory | null>(null)
  const [newLab, setNewLab] = useState<Partial<Laboratory>>({
    labName: "",
    headChef: "",
    address: "",
    phone: "",
    email: "",
    capacity: undefined,
    hygieneRating: undefined,
    lastInspectionDate: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const getToken = () => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }

  // Fetch laboratories from API
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const fetchLaboratories = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          if (response.status === 401) router.push("/login")
          throw new Error("Failed to fetch laboratories")
        }
        const data = await response.json()
        setLaboratories(data)
      } catch (error) {
        console.error("Fetch error:", error)
        toast({
          title: "Erreur de chargement",
          description: "Impossible de récupérer la liste des laboratoires.",
          variant: "destructive",
        })
        setLaboratories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLaboratories()
  }, [toast, router])

  // Filter laboratories based on search term
  const filteredLaboratories = laboratories.filter(
    (lab) =>
      lab.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.headChef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle laboratory creation
  const handleCreateLaboratory = async () => {
    if (!newLab.labName?.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du laboratoire est obligatoire.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Erreur d'authentification", description: "Veuillez vous reconnecter.", variant: "destructive" })
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        labName: newLab.labName.trim(),
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
        if (response.status === 401) router.push("/login")
        throw new Error(errorData.message || "Failed to create laboratory")
      }

      const result = await response.json()

      // Refresh laboratories list
      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const updatedLabs = await fetchResponse.json()
      setLaboratories(updatedLabs)

      setNewLab({
        labName: "",
        headChef: "",
        address: "",
        phone: "",
        email: "",
        capacity: undefined,
        hygieneRating: undefined,
        lastInspectionDate: "",
      })
      setIsCreateDialogOpen(false)
      toast({
        title: "Laboratoire créé",
        description: result.message || `Le laboratoire ${result.data.labName} a été créé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le laboratoire.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle laboratory update
  const handleUpdateLaboratory = async () => {
    if (!editingLab || !editingLab._id) return

    if (!editingLab.labName?.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du laboratoire est obligatoire.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Erreur d'authentification", description: "Veuillez vous reconnecter.", variant: "destructive" })
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        labName: editingLab.labName.trim(),
        headChef: editingLab.headChef?.trim() || "",
        address: editingLab.address?.trim() || "",
        phone: editingLab.phone?.trim() || "",
        email: editingLab.email?.trim() || "",
        capacity: editingLab.capacity || undefined,
        hygieneRating: editingLab.hygieneRating || undefined,
        lastInspectionDate: editingLab.lastInspectionDate || undefined,
        isActive: editingLab.isActive,
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
        if (response.status === 401) router.push("/login")
        throw new Error(errorData.message || "Failed to update laboratory")
      }

      const result = await response.json()

      // Refresh laboratories list
      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const refreshedLabs = await fetchResponse.json()
      setLaboratories(refreshedLabs)

      setIsEditDialogOpen(false)
      setEditingLab(null)
      toast({
        title: "Laboratoire mis à jour",
        description: result.message || `Le laboratoire ${editingLab.labName} a été mis à jour avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour le laboratoire.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle laboratory deletion
  const handleDeleteLaboratory = async () => {
    if (!labToDelete || !labToDelete._id) return

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Erreur d'authentification", description: "Veuillez vous reconnecter.", variant: "destructive" })
      setIsLoading(false)
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
        if (response.status === 401) router.push("/login")
        throw new Error(errorData.message || "Failed to delete laboratory")
      }

      const result = await response.json()

      // Refresh laboratories list
      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const refreshedLabs = await fetchResponse.json()
      setLaboratories(refreshedLabs)

      setIsDeleteDialogOpen(false)
      setLabToDelete(null)
      toast({
        title: "Laboratoire désactivé",
        description: result.message || `Le laboratoire ${labToDelete.labName} a été désactivé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de désactivation",
        description: error.message || "Impossible de désactiver le laboratoire.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
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

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laboratoires</h1>
            <p className="text-muted-foreground">Gérez les laboratoires et leurs informations</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau laboratoire
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau laboratoire</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouveau laboratoire</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="labName">Nom du laboratoire *</Label>
                  <Input
                    id="labName"
                    value={newLab.labName}
                    onChange={(e) => setNewLab({ ...newLab, labName: e.target.value })}
                    placeholder="Nom du laboratoire"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headChef">Chef de laboratoire</Label>
                  <Input
                    id="headChef"
                    value={newLab.headChef}
                    onChange={(e) => setNewLab({ ...newLab, headChef: e.target.value })}
                    placeholder="Nom du chef de laboratoire"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={newLab.address}
                    onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
                    placeholder="Adresse complète du laboratoire"
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
                      placeholder="email@laboratoire.fr"
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
                      value={newLab.hygieneRating || "A"}
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                  Annuler
                </Button>
                <Button onClick={handleCreateLaboratory} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des laboratoires</CardTitle>
            <CardDescription>{laboratories.length} laboratoires trouvés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un laboratoire..."
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
                          Chargement des laboratoires...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLaboratories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucun laboratoire trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLaboratories.map((lab) => (
                      <TableRow key={lab._id} className={!lab.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{lab.labName}</TableCell>
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
                                <Button variant="ghost" size="icon" disabled={isLoading}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du laboratoire</DialogTitle>
                                  <DialogDescription>Informations complètes du laboratoire</DialogDescription>
                                </DialogHeader>
                                {viewingLab && (
                                  <div className="grid gap-6 py-4">
                                    <div className="grid gap-4">
                                      <h3 className="text-lg font-semibold">Informations générales</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Nom du laboratoire</Label>
                                          <p className="text-sm text-muted-foreground">{viewingLab.labName}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Chef de laboratoire</Label>
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
                                <Button variant="ghost" size="icon" disabled={isLoading}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Modifier le laboratoire</DialogTitle>
                                  <DialogDescription>Modifiez les informations du laboratoire</DialogDescription>
                                </DialogHeader>
                                {editingLab && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-labName">Nom du laboratoire *</Label>
                                      <Input
                                        id="edit-labName"
                                        value={editingLab.labName}
                                        onChange={(e) =>
                                          setEditingLab({
                                            ...editingLab,
                                            labName: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-headChef">Chef de laboratoire</Label>
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
                                          value={editingLab.hygieneRating || "A"}
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
                                          value={
                                            editingLab.lastInspectionDate
                                              ? editingLab.lastInspectionDate.split("T")[0]
                                              : ""
                                          }
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
                                    disabled={isLoading}
                                  >
                                    Annuler
                                  </Button>
                                  <Button onClick={handleUpdateLaboratory} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Enregistrer
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
                                  disabled={isLoading || !lab.isActive}
                                  title={!lab.isActive ? "Laboratoire déjà inactif" : "Désactiver"}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Désactiver</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmer la désactivation</DialogTitle>
                                  <DialogDescription>
                                    Êtes-vous sûr de vouloir désactiver le laboratoire{" "}
                                    <strong>{labToDelete?.labName}</strong> ? Cette action peut être annulée en
                                    modifiant le statut du laboratoire.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsDeleteDialogOpen(false)
                                      setLabToDelete(null)
                                    }}
                                    disabled={isLoading}
                                  >
                                    Annuler
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteLaboratory} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Désactiver
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
