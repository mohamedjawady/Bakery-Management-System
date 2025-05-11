"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarToggleProps {
  isCollapsed: boolean
  onClick: () => void
  className?: string
}

export function SidebarToggle({ isCollapsed, onClick, className }: SidebarToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`absolute -right-3 top-6 h-6 w-6 rounded-full border shadow-md ${className ?? ""}`}
            onClick={onClick}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isCollapsed ? "Développer" : "Réduire"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
