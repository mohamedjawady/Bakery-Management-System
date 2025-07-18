"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarCollapseButton } from "@/components/layout/sidebar-collapse-button";

// Import styles
import "@/styles/sidebar.css";
import "@/styles/sidebar-animations.css";
import "@/styles/responsive-tables.css";
import "@/styles/delivery-management.css";
import "@/styles/sidebar-logo.css";
import "@/styles/mobile-nav.css";
import "@/styles/sidebar-scroll.css";
import "@/styles/theme-toggle.css";
import "@/styles/sidebar-hover.css";
import "@/styles/sidebar-hover-patch.css";
import "@/styles/sidebar-hover-ultimate.css";
import "@/styles/sidebar-hover-fix.css";
import "@/styles/sidebar-administrateur-fix.css";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Croissant,
  Home,
  Info, // Added Info icon
  LogOut,
  Menu,
  Moon,
  Settings,
  ShoppingBag,
  Sun,
  Truck,
  Users,
  Megaphone,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "bakery" | "laboratory" | "delivery";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMobile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  // Get sidebar state from localStorage if available
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [localStorageAvailable, setLocalStorageAvailable] = useState<boolean>(false);
  // Handle initial mounting and hydration - needed for theme toggling
  useEffect(() => {
    setMounted(true);
    
    // Check if localStorage is available (avoiding exceptions in some browsers)
    try {
      localStorage.setItem('localStorage_test', 'yes');
      if(localStorage.getItem('localStorage_test') === 'yes') {
        localStorage.removeItem('localStorage_test');
        setLocalStorageAvailable(true);
        
        // Load saved sidebar state
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) setSidebarCollapsed(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('localStorage not available, sidebar state will not persist');
    }
  }, []);

  // Save sidebar state when it changes
  const updateSidebarState = (state: boolean) => {
    setSidebarCollapsed(state);
    
    // Only try to use localStorage if available
    if (localStorageAvailable) {
      try {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to save sidebar state', e);
      }
    }
  };
    // Toggle sidebar between collapsed and expanded states
  const toggleSidebar = () => {
    updateSidebarState(!sidebarCollapsed);
  };
  
  // Add keyboard shortcut support for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar on Ctrl+B (like VS Code)
      if (e.ctrlKey && e.key === "b" && !isMobile) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, toggleSidebar]);

  // Check if user is logged in and has the correct role
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo"); // Changed "user" to "userInfo"
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // If user role doesn't match the required role for this page, redirect
      if (parsedUser.role !== role) {
        toast({
          title: "Accès non autorisé",
          description: `Vous n'avez pas les droits pour accéder à cette page.`,
          variant: "destructive",
        });
        router.push(`/${parsedUser.role}/dashboard`);
      }
    } else {
      // If no user is logged in, redirect to login
      toast({
        title: "Session expirée",
        description: "Veuillez vous reconnecter",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [role, router, toast]);

  // Close mobile sidebar when navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo"); // Changed "user" to "userInfo"
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    router.push("/");  };
  // Define navigation items for each role
  const adminNavItems = [
    { href: "/admin/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/laboratory", label: "Laboratoire", icon: Users },
    { href: "/admin/bakery", label: "Boulangerie", icon: Users },
    { href: "/admin/products", label: "Produits", icon: ShoppingBag },
    { href: "/admin/orders", label: "Commandes", icon: ClipboardList },
    { href: "/admin/delivery", label: "Livraisons", icon: Truck },
    { href: "/admin/delivery/validation", label: "Validation Livraisons", icon: AlertTriangle },
    { href: "/admin/annoucements", label: "Annoucements", icon: Megaphone },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  const bakeryNavItems = [
    { href: "/bakery/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/bakery/profile", label: "Profil", icon: Users },
    { href: "/bakery/products", label: "Produits", icon: ShoppingBag },
    { href: "/bakery/annoucements", label: "Annoucements", icon: Megaphone },
    { href: "/bakery/orders", label: "Commandes", icon: ClipboardList },
  ];

  const laboratoryNavItems = [
    { href: "/laboratory/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/laboratory/production", label: "Production", icon: ClipboardList },
     { href: "/laboratory/annoucements", label: "Annoucements", icon: Megaphone },
    { href: "/laboratory/information", label: "Informations", icon: Settings }, // Changed label
  ];

  const deliveryNavItems = [
    { href: "/delivery/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/delivery/routes", label: "Itinéraires", icon: Truck },
  ];

  const navItems = {
    admin: adminNavItems,
    bakery: bakeryNavItems,
    laboratory: laboratoryNavItems,
    delivery: deliveryNavItems,
  }[role];

  const roleLabels = {
    admin: "Administrateur",
    bakery: "Boulangerie",
    laboratory: "Laboratoire",
    delivery: "Livraison",
  };
  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content area with sidebar */}
      <div className="flex flex-1 relative min-h-screen">
        {/* Responsive hover-expandable sidebar for desktop */}
        {!isMobile && mounted && (          <nav
            className="sidebar-hover-expand sidebar hidden md:flex flex-col h-screen z-40 border-r border-border bg-background"
            aria-label="Sidebar navigation"
          >{/* Logo and brand header - optimized for role label positioning */}
            <div className="flex items-center h-16 px-3 border-b border-border sidebar-logo-container role-label-container">
              <Croissant className="h-5 w-5 text-amber-500 flex-shrink-0 sidebar-icon" aria-hidden="true" />
              <span className="text-base font-medium whitespace-nowrap overflow-hidden sidebar-link-text role-label" id="role-label">
                {roleLabels[role]}
              </span>
            </div>
              <div className="flex-1 flex flex-col justify-between overflow-y-auto scrollbar-hide pt-1">
                <div className="space-y-1 px-2 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full h-9 my-0.5 transition-all duration-300 sidebar-nav-item ${isActive ? 'active' : ''}`}
                            asChild
                            aria-label={item.label}
                          >
                            <Link href={item.href} className="flex items-center">
                              <Icon className="h-4 w-4 sidebar-icon" />
                              <span className="sidebar-link-text text-sm font-medium">{item.label}</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="z-50 sidebar-tooltip">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
                <div className="mt-3 border-t pt-3 px-2 flex flex-col gap-1">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full h-9 sidebar-nav-item" 
                        onClick={handleLogout}                        aria-label="Déconnexion"
                      >
                        <LogOut className="h-4 w-4 sidebar-icon" />
                        <span className="sidebar-link-text text-sm font-medium">Déconnexion</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="sidebar-tooltip">
                      Déconnexion
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Utility buttons are now direct children of the above div */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="w-full h-9 sidebar-nav-item relative">
                        <span className="relative flex items-center">
                          <Bell className="h-4 w-4 sidebar-icon" />
                          <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-600 transform translate-x-1/2 -translate-y-1/2"></span>
                        </span>
                        <span className="sidebar-link-text text-sm font-medium">Notifications</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="sidebar-tooltip">
                      Notifications
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full h-9 sidebar-nav-item theme-toggle-button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                      >
                        <div className="relative h-4 w-4 sidebar-icon">
                          <Sun className="h-4 w-4 sun-icon" />
                          <Moon className="h-4 w-4 moon-icon" />
                        </div>
                        <span className="sidebar-link-text text-sm font-medium">
                          {theme === "dark" ? "Mode clair" : "Mode sombre"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="sidebar-tooltip">
                      {theme === "dark" ? "Mode clair" : "Mode sombre"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full h-9 sidebar-nav-item">
                            <Avatar className="h-4 w-4 sidebar-icon">
                              <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
                              <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || "JD"}</AvatarFallback>
                            </Avatar>
                            <span className="sidebar-link-text text-sm font-medium">Mon Compte</span>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="sidebar-tooltip">
                        Mon Compte
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-medium text-sm">{user?.email || "Jean Dupont"}</p>
                        <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${role}/profile`} className="flex w-full cursor-pointer items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                      </Link>
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
            {/* Sidebar toggle button - hidden with hover-expandable behavior */}
            <div className="sidebar-collapse-button">
              <SidebarCollapseButton
                collapsed={sidebarCollapsed}
                onClick={toggleSidebar}
              />
            </div>
          </nav>        )}
        {/* Mobile sidebar */}
        {isMobile && (
          <>
            {/* NEW: Wrapper for Mobile Top Bar AND Main Content */}
            <div className="flex-1 flex flex-col">

              {/* Mobile Experience: Top Bar with Trigger + Sidebar Sheet */}
              <Sheet open={open} onOpenChange={setOpen}>
                {/* Mobile Top Bar */}
                <div className="bg-background border-b p-3 flex items-center shadow-sm md:hidden h-14">
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-3">
                      <Menu className="h-6 w-6 text-foreground" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <h1 className="text-lg font-semibold">{roleLabels[role]}</h1>
                </div>

                {/* Mobile Sidebar Content */}
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-r sidebar-sheet [&>button]:hidden">
                  {/* Content from original mobile nav structure */}
                  <nav className="mobile-nav-wrapper h-full flex flex-col" aria-label="Mobile navigation">
                    <div className="mobile-nav-header flex-shrink-0">
                      <div className="flex items-center">
                        <Croissant className="h-5 w-5 sidebar-logo mr-3" />
                        <span className="text-base font-medium">{roleLabels[role]}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="sidebar-close-button">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Button
                            key={item.href}
                            variant={isActive ? "secondary" : "ghost"}
                            className="w-full justify-start sidebar-nav-link"
                            asChild
                          >
                            <Link href={item.href} className="flex items-center" onClick={() => setOpen(false)}>
                              <Icon className="mr-3 h-5 w-5 sidebar-nav-icon" />
                              <span>{item.label}</span>
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex-shrink-0 mt-auto p-4 border-t space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start sidebar-nav-link theme-toggle-mobile"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        {theme === "dark" ? (
                          <>
                            <Sun className="mr-3 h-5 w-5 sidebar-nav-icon theme-icon" />
                            <span>Mode clair</span>
                          </>
                        ) : (
                          <>
                            <Moon className="mr-3 h-5 w-5 sidebar-nav-icon theme-icon" />
                            <span>Mode sombre</span>
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" className="w-full justify-start sidebar-nav-link" onClick={handleLogout}>
                        <LogOut className="mr-3 h-5 w-5 sidebar-nav-icon" />
                        <span>Déconnexion</span>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>

              {/* Main content for MOBILE, now correctly placed under the top bar */}
              <main className="flex-1 py-4 overflow-y-auto px-4 md:px-6">
                <div className="prevent-overlap transition-all duration-300">
                  <div className="max-w-full">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </>
        )}
        {/* Main content for DESKTOP ONLY */}
        {!isMobile && (
          <main className={`flex-1 py-4 transition-all duration-300 overflow-y-auto content-with-hover-sidebar px-4 md:px-6`}>
            <div className="prevent-overlap transition-all duration-300">
              <div className="max-w-full">
                {children}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
