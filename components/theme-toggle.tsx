"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThemeToggleProps {
  variant?: "default" | "outline" | "mobile"
  showTooltip?: boolean
  className?: string
}

export function ThemeToggle({
  variant = "default",
  showTooltip = true,
  className = ""
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // For mobile variant
  if (variant === "mobile") {
    return (
      <Button
        variant="outline"
        className={`w-full justify-start sidebar-nav-link theme-toggle-mobile ${className}`}
        onClick={toggleTheme}
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
    )
  }

  // For default and outline variants
  const buttonContent = (
    <Button
      variant={variant === "outline" ? "outline" : "ghost"}
      size="icon"
      className={`h-8 w-8 rounded-full theme-toggle-button ${className}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] sun-icon" />
      <Moon className="h-[1.2rem] w-[1.2rem] moon-icon" />
    </Button>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}
