"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, FlaskConical, Key } from "lucide-react"
import Link from "next/link"

interface LaboratoryProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
}

export default function LaboratoryProfilePage() {
  const [profile, setProfile] = useState<LaboratoryProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken()
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) router.push("/login")
          throw new Error("Failed to fetch profile")
        }

        const userData = await response.json()
        setProfile({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil utilisateur.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router, toast])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        if (response.status === 401) router.push("/login")
        throw new Error("Failed to update profile")
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder le profil.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout role="laboratory">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos paramètres de laboratoire
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Vos informations de base et de contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="votre.email@exemple.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Votre adresse complète"
                />
              </div>
            </CardContent>
          </Card>

          {/* Laboratory Settings & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Paramètres du laboratoire
              </CardTitle>
              <CardDescription>
                Paramètres spécifiques au laboratoire et sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Rôle actuel</h4>
                  <p className="text-sm text-muted-foreground">
                    Vous êtes connecté en tant que membre du laboratoire. Vous avez accès à la gestion de la production et au suivi des commandes.
                  </p>
                </div>
              </div>
              
              {/* Password Management Section */}
              <div className="pt-4 border-t">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Sécurité du compte
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Gérez votre mot de passe et la sécurité de votre compte
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/profile/change-password">
                        Changer le mot de passe
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Actions rapides</h4>
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/laboratory/information">
                        Informations du laboratoire
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/laboratory/production">
                        Gestion de la production
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
