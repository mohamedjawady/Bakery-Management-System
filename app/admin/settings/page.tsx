"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface UserInfo {
  _id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  role: string
  token: string
}

interface Settings {
  userInfo: UserInfo
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

const getInitialSettings = (): Settings => {
  const defaultUserInfo: UserInfo = {
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    isActive: true,
    role: "admin",
    token: "",
  }

  return {
    userInfo: defaultUserInfo,
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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(getInitialSettings())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    try {
      const storedUserInfo = localStorage.getItem("userInfo")
      if (storedUserInfo) {
        const userInfo: UserInfo = JSON.parse(storedUserInfo)
        setSettings((prev) => ({
          ...prev,
          userInfo,
        }))
      }
    } catch (error) {
      console.error("Error loading user info from localStorage:", error)
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
      const token = userInfo.token

      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: settings.userInfo.firstName,
          lastName: settings.userInfo.lastName,
          email: settings.userInfo.email,
          isActive: settings.userInfo.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update profile")
      }

      const updatedUser = await response.json()

      // Update localStorage with the response data
      const updatedUserInfo = {
        ...userInfo,
        ...updatedUser,
      }
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo))

      // Update local state
      setSettings((prev) => ({
        ...prev,
        userInfo: updatedUserInfo,
      }))

      toast({
        title: "Settings Saved",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Manage your personal account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.userInfo.firstName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        userInfo: { ...settings.userInfo, firstName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.userInfo.lastName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        userInfo: { ...settings.userInfo, lastName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.userInfo.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        userInfo: { ...settings.userInfo, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={settings.userInfo.role} disabled className="bg-muted" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={settings.userInfo.isActive}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        userInfo: { ...settings.userInfo, isActive: checked },
                      })
                    }
                  />
                  <Label htmlFor="isActive">Account Active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
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
                  <Label htmlFor="emailNotif">Email notifications</Label>
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
                  <Label htmlFor="pushNotif">Push notifications</Label>
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
                  <Label htmlFor="orderNotif">New orders</Label>
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
                  <Label htmlFor="deliveryNotif">Delivery updates</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
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
                  <Label htmlFor="twoFactor">Two-factor authentication</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label>Password</Label>
                  <p className="text-sm text-muted-foreground">Change your password for better security</p>
                  <Button variant="outline" onClick={() => (window.location.href = "/profile/change-password")}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
