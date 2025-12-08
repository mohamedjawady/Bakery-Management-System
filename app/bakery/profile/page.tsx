"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

const bakeryProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères."),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères."),
  postalCode: z.string().regex(/^[0-9]{5}$/, "Code postal invalide (doit être 5 chiffres)."),
  phone: z.string().min(10, "Numéro de téléphone invalide.").optional().or(z.literal("")),
  email: z.string().email("Adresse e-mail invalide."),
  siret: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  website: z.string().url("URL de site web invalide.").optional().or(z.literal("")),
  logoUrl: z.string().url("URL de logo invalide.").optional().or(z.literal("")),
})

type BakeryProfileFormValues = z.infer<typeof bakeryProfileSchema>

export default function ProfilePage() {
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const getToken = () => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo")
      return userInfo ? JSON.parse(userInfo).token : null
    }
    return null
  }

  const form = useForm<BakeryProfileFormValues>({
    resolver: zodResolver(bakeryProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      siret: "",
      vatNumber: "",
      website: "",
      logoUrl: "",
    },
  })

  useEffect(() => {
  const fetchBakeryInfo = async () => {
    setIsLoadingData(true)

    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    try {
      // Get bakery name from localStorage
      const userData = localStorage.getItem("userInfo") || localStorage.getItem("userData")
      if (!userData) {
        throw new Error("Aucune donnée utilisateur trouvée.")
      }

      const user = JSON.parse(userData)
      const bakeryName = user.bakeryName
      if (!bakeryName) {
        throw new Error("Nom de la boulangerie introuvable dans les données utilisateur.")
      }

      // ✅ Call API with bakery name
      const response = await fetch(
        `/bakery/name/${(bakeryName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Échec de la récupération des informations de la boulangerie.")
      }

      const data = await response.json()
      console.log("✅ Bakery info loaded:", data)

      if (data) {
        form.reset({
          name: data.bakeryName || "",
          address: data.address || "",
          city: data.city || "",
          postalCode: data.postalCode || "",
          phone: data.phone || "",
          email: data.email || "",
          siret: data.siret || "",
          vatNumber: data.vatNumber || "",
          website: data.website || "",
          logoUrl: data.logoUrl || "",
        })
      } else {
        toast({
          title: "Aucune information de boulangerie trouvée",
          description: "Veuillez remplir le formulaire pour ajouter les informations.",
        })
      }
    } catch (error: any) {
      console.error("Error fetching bakery info:", error)
      toast({
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger les informations de la boulangerie.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  fetchBakeryInfo()
}, [form, toast, router])


  async function onProfileSubmit(data: BakeryProfileFormValues) {
    setIsSaving(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/bakery-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) router.push("/login")
        throw new Error("Failed to update bakery information")
      }

      const result = await response.json()
      form.reset(result)

      toast({
        title: "Profil mis à jour",
        description: "Les informations de la boulangerie ont été mises à jour avec succès.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder les informations.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      })
      return
    }
    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      })
      return
    }
    if (!currentPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre mot de passe actuel.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    const token = getToken()
    if (!token) {
      router.push("/login")
      setIsChangingPassword(false)
      return
    }

    try {
      const response = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        if (response.status === 401) router.push("/login")
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de changement de mot de passe",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoadingData) {
    return (
      <DashboardLayout role="bakery">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations de boulangerie et vos paramètres de compte.</p>
        </div>

        <Tabs defaultValue="bakery-info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bakery-info">Informations Boulangerie</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="bakery-info">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                  <CardHeader>
                    <CardTitle>Détails de la Boulangerie</CardTitle>
                    <CardDescription>Modifiez les informations principales de votre boulangerie.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la Boulangerie</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de votre boulangerie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Rue Principale" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input placeholder="Paris" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code Postal</FormLabel>
                            <FormControl>
                              <Input placeholder="75001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 1 23 45 67 89" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@maboulangerie.fr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="siret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIRET (Optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678900011" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de TVA (Optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="FR12345678900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Web (Optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.maboulangerie.fr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL du Logo (Optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        "Enregistrer les informations"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>Mettez à jour votre mot de passe pour sécuriser votre compte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Changer le mot de passe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
