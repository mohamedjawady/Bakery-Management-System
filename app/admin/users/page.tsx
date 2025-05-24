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
import { Edit, Plus, Search, Trash, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Define user type
interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "bakery" | "laboratory" | "delivery"
  createdAt: string
  updatedAt?: string
  isActive?: boolean
  phone?: string
  address?: string
  vehicleType?: string
  vehicleRegistration?: string
}

const API_BASE_URL = "/api/users"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>({
    firstName: "",
    lastName: "",
    email: "",
    role: "bakery",
    password: "",
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

  // Fetch users from API
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          if (response.status === 401) router.push("/login")
          throw new Error("Failed to fetch users")
        }
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Fetch error:", error)
        toast({
          title: "Erreur de chargement",
          description: "Impossible de récupérer la liste des utilisateurs.",
          variant: "destructive",
        })
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [toast, router])
  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  // Handle user creation
  const handleCreateUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role || !newUser.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email, Rôle, Mot de passe)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Authentication Error", description: "Please login again.", variant: "destructive" })
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) router.push("/login")
        throw new Error(errorData.message || "Failed to create user")
      }

      const createdUser = await response.json()
      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const updatedUsers = await fetchResponse.json()
      setUsers(updatedUsers)
      setNewUser({ firstName: "", lastName: "", email: "", role: "bakery", password: "" })
      setIsCreateDialogOpen(false)
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${createdUser.firstName} ${createdUser.lastName} a été créé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle user update
  const handleUpdateUser = async () => {
    if (!editingUser || !editingUser._id) return

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Authentication Error", description: "Please login again.", variant: "destructive" })
      setIsLoading(false)
      return
    }
    try {      const payload: Partial<User> & { password?: string } = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      }
      const passwordInput = document.getElementById("reset-password") as HTMLInputElement
      if (passwordInput && passwordInput.value) {
        payload.password = passwordInput.value
      }

      const response = await fetch(`${API_BASE_URL}/${editingUser._id}`, {
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
        throw new Error(errorData.message || "Failed to update user")
      }

      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const refreshedUsers = await fetchResponse.json()
      setUsers(refreshedUsers)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast({
        title: "Utilisateur mis à jour",
        description: `L'utilisateur ${editingUser.firstName} ${editingUser.lastName} a été mis à jour avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour l'utilisateur.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete._id) return

    setIsLoading(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      toast({ title: "Authentication Error", description: "Please login again.", variant: "destructive" })
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${userToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) router.push("/login")
        throw new Error(errorData.message || "Failed to delete user")
      }

      const fetchResponse = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const refreshedUsers = await fetchResponse.json()
      setUsers(refreshedUsers)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      toast({
        title: "Utilisateur désactivé",
        description: `L'utilisateur ${userToDelete.firstName} ${userToDelete.lastName} a été désactivé avec succès`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de désactivation",
        description: error.message || "Impossible de désactiver l'utilisateur.",
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

  // Role translation
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrateur",
      bakery: "Boulangerie",
      laboratory: "Laboratoire",
      delivery: "Livraison",
    }
    return roles[role] || role
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les utilisateurs du système et leurs rôles</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" /> Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouvel utilisateur</DialogDescription>
              </DialogHeader>              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Prénom de l'utilisateur"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Nom de famille"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@boulangerie.fr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({
                        ...newUser,
                        role: value as "admin" | "bakery" | "laboratory" | "delivery",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="bakery">Boulangerie</SelectItem>
                      <SelectItem value="laboratory">Laboratoire</SelectItem>
                      <SelectItem value="delivery">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe initial</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mot de passe"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>{users.length} utilisateurs trouvés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
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
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                          Chargement des utilisateurs...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (                      <TableRow key={user._id} className={!user.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{translateRole(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive === false ? (
                            <Badge variant="outline">Inactif</Badge>
                          ) : (
                            <Badge variant="default">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={isEditDialogOpen && editingUser?._id === user._id}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open)
                                if (open) setEditingUser(user)
                                else setEditingUser(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isLoading}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier l'utilisateur</DialogTitle>
                                  <DialogDescription>Modifiez les informations de l'utilisateur</DialogDescription>
                                </DialogHeader>                                {editingUser && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-firstName">Prénom</Label>
                                      <Input
                                        id="edit-firstName"
                                        value={editingUser.firstName}
                                        onChange={(e) =>
                                          setEditingUser({
                                            ...editingUser,
                                            firstName: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-lastName">Nom</Label>
                                      <Input
                                        id="edit-lastName"
                                        value={editingUser.lastName}
                                        onChange={(e) =>
                                          setEditingUser({
                                            ...editingUser,
                                            lastName: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-email">Email</Label>
                                      <Input
                                        id="edit-email"
                                        type="email"
                                        value={editingUser.email}
                                        onChange={(e) =>
                                          setEditingUser({
                                            ...editingUser,
                                            email: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-role">Rôle</Label>
                                      <Select
                                        value={editingUser.role}
                                        onValueChange={(value) =>
                                          setEditingUser({
                                            ...editingUser,
                                            role: value as "admin" | "bakery" | "laboratory" | "delivery",
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionnez un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Administrateur</SelectItem>
                                          <SelectItem value="bakery">Boulangerie</SelectItem>
                                          <SelectItem value="laboratory">Laboratoire</SelectItem>
                                          <SelectItem value="delivery">Livraison</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-isActive">Statut</Label>
                                      <Select
                                        value={editingUser.isActive === false ? "false" : "true"}
                                        onValueChange={(value) =>
                                          setEditingUser({
                                            ...editingUser,
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
                                    <div className="grid gap-2">
                                      <Label htmlFor="reset-password">Réinitialiser le mot de passe</Label>
                                      <Input
                                        id="reset-password"
                                        type="password"
                                        placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditDialogOpen(false)
                                      setEditingUser(null)
                                    }}
                                    disabled={isLoading}
                                  >
                                    Annuler
                                  </Button>
                                  <Button onClick={handleUpdateUser} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Enregistrer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isDeleteDialogOpen && userToDelete?._id === user._id}
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open)
                                if (open) setUserToDelete(user)
                                else setUserToDelete(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isLoading || !user.isActive}
                                  title={!user.isActive ? "Utilisateur déjà inactif" : "Désactiver"}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Désactiver</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmer la désactivation</DialogTitle>                                  <DialogDescription>
                                    Êtes-vous sûr de vouloir désactiver l'utilisateur <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsDeleteDialogOpen(false)
                                      setUserToDelete(null)
                                    }}
                                    disabled={isLoading}
                                  >
                                    Annuler
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
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
