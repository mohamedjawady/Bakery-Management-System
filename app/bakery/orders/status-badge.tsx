import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          En attente
        </Badge>
      )
    case "IN_PROGRESS":
      return <Badge variant="secondary">En préparation</Badge>
    case "READY_FOR_DELIVERY":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Prêt à livrer
        </Badge>
      )
    case "DELIVERING":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          En livraison
        </Badge>
      )
    case "DELIVERED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Livré
        </Badge>
      )
    case "CANCELLED":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Annulé
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
