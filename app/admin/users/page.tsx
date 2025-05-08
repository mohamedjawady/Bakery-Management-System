"use client"

import { useState } from "react"
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
import { Edit, Plus, Search, Trash } from "lucide-react"

// Define user type
interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "BAKERY" | "LABORATORY" | "DELIVERY"
  createdAt: string
}

// Sample data
const initialUsers: User[] = [
  {
    id: "1",
    name: "Admin Principal",
    email: "admin@boulangerie.fr",
    role: "ADMIN",
    createdAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Boulangerie Saint-Michel",
    email: "saintmichel@boulangerie.fr",
    role: "BAKERY",
    createdAt: "2025-01-20T14:15:00Z",
  },
  {
    id: "3",
    name: "Boulangerie Montmartre",
    email: "montmartre@boulangerie.fr",
    role: "BAKERY",
    createdAt: "2025-01-22T09:45:00Z",
  },
  {
    id: "4",
    name: "Laboratoire Central",
    email: "labo.central@boulangerie.fr",
    role: "LABORATORY",
    createdAt: "2025-01-10T08:20:00Z",
  },
  {
    id: "5",
    name: "Laboratoire Est",
    email: "labo.est@boulangerie.fr",
    role: "LABORATORY",
    createdAt: "2025-01-12T11:10:00Z",
  },
  {
    id: "6",
    name: "Pierre Dupont",
    email: "p.dupont@boulangerie.fr",
    role: "DELIVERY",
    createdAt: "2025-01-25T07:30:00Z",
  },
  {
    id: "7",
    name: "Marie Lambert",
    email: "m.lambert@boulangerie.fr",
    role: "DELIVERY",
    createdAt: "2025-01-26T08:45:00Z",
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    role: "BAKERY",
  })
  const { toast } = useToast()

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle user creation
  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    const createdUser: User = {
      id: `${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "ADMIN" | "BAKERY" | "LABORATORY" | "DELIVERY",
      createdAt: new Date().toISOString(),
    }

    setUsers([...users, createdUser])
    setNewUser({ name: "", email: "", role: "BAKERY" })
    setIsCreateDialogOpen(false)
    toast({
      title: "Utilisateur créé",
      description: `L'utilisateur ${createdUser.name} a été créé avec succès`,
    })
  }

  // Handle user update
  const handleUpdateUser = () => {
    if (!editingUser) return

    const updatedUsers = users.map((user) => (user.id === editingUser.id ? editingUser : user))
    setUsers(updatedUsers)
    setIsEditDialogOpen(false)
    toast({
      title: "Utilisateur mis à jour",
      description: `L'utilisateur ${editingUser.name} a été mis à jour avec succès`,
    })
  }

  // Handle user deletion
  const handleDeleteUser = () => {
    if (!userToDelete) return

    const updatedUsers = users.filter((user) => user.id !== userToDelete.id)
    setUsers(updatedUsers)
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
    toast({
      title: "Utilisateur supprimé",
      description: `L'utilisateur ${userToDelete.name} a été supprimé avec succès`,
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
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
      ADMIN: "Administrateur",
      BAKERY: "Boulangerie",
      LABORATORY: "Laboratoire",
      DELIVERY: "Livraison",
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
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouvel utilisateur</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nom de l'utilisateur"
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
                        role: value as "ADMIN" | "BAKERY" | "LABORATORY" | "DELIVERY",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                      <SelectItem value="BAKERY">Boulangerie</SelectItem>
                      <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                      <SelectItem value="DELIVERY">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe initial</Label>
                  <Input id="password" type="password" placeholder="Mot de passe" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>{filteredUsers.length} utilisateurs trouvés</CardDescription>
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
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{translateRole(user.role)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={isEditDialogOpen && editingUser?.id === user.id}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open)
                                if (open) setEditingUser(user)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier l'utilisateur</DialogTitle>
                                  <DialogDescription>Modifiez les informations de l'utilisateur</DialogDescription>
                                </DialogHeader>
                                {editingUser && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-name">Nom</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingUser.name}
                                        onChange={(e) =>
                                          setEditingUser({
                                            ...editingUser,
                                            name: e.target.value,
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
                                            role: value as "ADMIN" | "BAKERY" | "LABORATORY" | "DELIVERY",
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionnez un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ADMIN">Administrateur</SelectItem>
                                          <SelectItem value="BAKERY">Boulangerie</SelectItem>
                                          <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                                          <SelectItem value="DELIVERY">Livraison</SelectItem>
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
                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Annuler
                                  </Button>
                                  <Button onClick={handleUpdateUser}>Enregistrer</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isDeleteDialogOpen && userToDelete?.id === user.id}
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open)
                                if (open) setUserToDelete(user)
                                else setUserToDelete(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Supprimer</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmer la suppression</DialogTitle>
                                  <DialogDescription>
                                    Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
                                    <strong>{userToDelete?.name}</strong> ? Cette action est irréversible.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                    Annuler
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteUser}>
                                    Supprimer
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
