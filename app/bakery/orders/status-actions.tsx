"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check, ChevronDown, Clock, Truck, X } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface StatusActionsProps {
  status: string
  orderId: string
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>
  disabled?: boolean
}

export function StatusActions({ status, orderId, onStatusChange, disabled = false }: StatusActionsProps) {
  const getNextActions = () => {
    switch (status) {
      case "PENDING":        return [
          { label: "Marquer en préparation", value: "IN_PROGRESS", icon: <Clock className="mr-2 h-4 w-4" /> },
          { label: "Annuler", value: "CANCELLED", icon: <X className="mr-2 h-4 w-4" /> },
        ]
      case "IN_PROGRESS":
        return [
          { label: "Marquer prêt à livrer", value: "READY_FOR_DELIVERY", icon: <Check className="mr-2 h-4 w-4" /> },
          { label: "Annuler", value: "CANCELLED", icon: <X className="mr-2 h-4 w-4" /> },
        ]
      case "READY_FOR_DELIVERY":
        return [
          { label: "Dispatcher", value: "DISPATCHED", icon: <Truck className="mr-2 h-4 w-4" /> },
          { label: "Annuler", value: "CANCELLED", icon: <X className="mr-2 h-4 w-4" /> },
        ]
      case "DISPATCHED":
        return [
          { label: "Marquer en livraison", value: "DELIVERING", icon: <Truck className="mr-2 h-4 w-4" /> },
          { label: "Annuler", value: "CANCELLED", icon: <X className="mr-2 h-4 w-4" /> },
        ]
      case "DELIVERING":
        return [
          { label: "Marquer comme livré", value: "DELIVERED", icon: <Check className="mr-2 h-4 w-4" /> },
          { label: "Annuler", value: "CANCELLED", icon: <X className="mr-2 h-4 w-4" /> },
        ]
      case "DELIVERED":
        return []
      case "CANCELLED":
        return [{ label: "Remettre en attente", value: "PENDING", icon: <Clock className="mr-2 h-4 w-4" /> }]
      default:
        return []
    }
  }

  const actions = getNextActions()

  if (actions.length === 0) {
    return <StatusBadge status={status} />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={disabled}>
          <StatusBadge status={status} />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.value}
            onClick={() => onStatusChange(orderId, action.value)}
            className="cursor-pointer"
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
