"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface Settings {
  companyName: string
  email: string
  phone: string
  address: string
  darkMode: boolean
  notifications: {
    email: boolean
    push: boolean
    orders: boolean
    deliveries: boolean
  }
  security: {
    twoFactor: boolean
    sessionTimeout: number
  }
}

const initialSettings: Settings = {
  companyName: "Ma Boulangerie",
  email: "contact@maboulangerie.fr",
  phone: "01 23 45 67 89",
  address: "123 Rue du Pain, 75001 Paris",
  darkMode: false,
  notifications: {
    email: true,
    push: true,
    orders: true,
    deliveries: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: 30,
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos paramètres ont été mis à jour avec succès",
    })
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Gérez les paramètres de votre compte</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Gérez les informations de base de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                  />
                  <Label htmlFor="darkMode">Mode sombre</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>
                  Gérez vos préférences de notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailNotif"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: checked },
                      })
                    }
                  />
                  <Label htmlFor="emailNotif">Notifications par email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pushNotif"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: checked },
                      })
                    }
                  />
                  <Label htmlFor="pushNotif">Notifications push</Label>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="orderNotif"
                    checked={settings.notifications.orders}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, orders: checked },
                      })
                    }
                  />
                  <Label htmlFor="orderNotif">Nouvelles commandes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deliveryNotif"
                    checked={settings.notifications.deliveries}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, deliveries: checked },
                      })
                    }
                  />
                  <Label htmlFor="deliveryNotif">Mises à jour des livraisons</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Gérez les paramètres de sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="twoFactor"
                    checked={settings.security.twoFactor}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactor: checked },
                      })
                    }
                  />
                  <Label htmlFor="twoFactor">Authentification à deux facteurs</Label>
                </div>                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <p className="text-sm text-muted-foreground">
                    Changez votre mot de passe pour plus de sécurité
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/profile/change-password'}
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Enregistrer les modifications</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
