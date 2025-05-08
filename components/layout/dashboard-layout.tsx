"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ClipboardList,
  Croissant,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShoppingBag,
  Sun,
  Truck,
  Users,
  X,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "admin" | "bakery" | "laboratory" | "delivery"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Check if user is logged in and has the correct role
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)

      // If user role doesn't match the required role for this page, redirect
      if (parsedUser.role !== role) {
        toast({
          title: "Accès non autorisé",
          description: `Vous n'avez pas les droits pour accéder à cette page.`,
          variant: "destructive",
        })
        router.push(`/${parsedUser.role}/dashboard`)
      }
    } else {
      // If no user is logged in, redirect to login
      toast({
        title: "Session expirée",
        description: "Veuillez vous reconnecter",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [role, router, toast])

  // Close mobile sidebar when navigating
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    })
    router.push("/")
  }

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/products", label: "Produits", icon: ShoppingBag },
    { href: "/admin/orders", label: "Commandes", icon: ClipboardList },
    { href: "/admin/delivery", label: "Livraisons", icon: Truck },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ]

  const bakeryNavItems = [
    { href: "/bakery/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/bakery/orders", label: "Commandes", icon: ClipboardList },
    { href: "/bakery/products", label: "Produits", icon: ShoppingBag },
    { href: "/bakery/profile", label: "Profil", icon: Users },
  ]

  const laboratoryNavItems = [
    { href: "/laboratory/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/laboratory/production", label: "Production", icon: ClipboardList },
  ]

  const deliveryNavItems = [
    { href: "/delivery/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/delivery/routes", label: "Itinéraires", icon: Truck },
  ]

  const navItems = {
    admin: adminNavItems,
    bakery: bakeryNavItems,
    laboratory: laboratoryNavItems,
    delivery: deliveryNavItems,
  }[role]

  const roleLabels = {
    admin: "Administrateur",
    bakery: "Boulangerie",
    laboratory: "Laboratoire",
    delivery: "Livraison",
  }

  const renderNavItems = () => (
    <div className="space-y-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <a href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </a>
        </Button>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          {isMobile ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 sm:max-w-xs">
                <div className="flex items-center mb-6">
                  <Croissant className="h-6 w-6 text-amber-500 mr-2" />
                  <span className="text-lg font-semibold">Boulangerie Manager</span>
                  <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fermer</span>
                  </Button>
                </div>
                {renderNavItems()}
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center mr-4">
              <Croissant className="h-6 w-6 text-amber-500 mr-2" />
              <span className="text-lg font-semibold hidden md:inline-block">Boulangerie Manager</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
                    <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || "JD"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user?.email || "Jean Dupont"}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={`/${role}/profile`}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <aside className="w-64 border-r bg-muted/40 hidden md:block">
            <div className="flex flex-col gap-2 p-4 pt-6">
              <div className="px-2 py-2">
                <h2 className="text-lg font-semibold tracking-tight mb-2">{roleLabels[role]}</h2>
                {renderNavItems()}
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
