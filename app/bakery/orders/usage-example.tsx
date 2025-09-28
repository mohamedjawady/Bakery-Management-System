"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LaboratoryOrderDialog } from "./laboratory-order-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

export default function OrderManagementExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleCreateOrder = async (orderData: any) => {
    setIsSubmitting(true)

    try {
      // Generate order IDs
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const orderReferenceId = `CMD-2025-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`

      const newOrder = {
        orderId,
        orderReferenceId,
        ...orderData,
        status: "PENDING",
        deliveryUserId: "DISPATCH_PENDING",
        deliveryUserName: "À assigner",
        actualDeliveryDate: null,
        isDispatched: true,
      }

      // Make API call to create order
      const response = await fetch("/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      })

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`)
      }

      const createdOrder = await response.json()

      toast({
        title: "Commande créée avec succès",
        description: `La commande ${createdOrder.orderReferenceId} a été créée pour le laboratoire ${orderData.laboratory}`,
      })

      setIsDialogOpen(false)

      // You can add additional logic here like refreshing the orders list
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Créez des commandes en sélectionnant d'abord un laboratoire</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Commande
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Processus de Commande Amélioré</h3>
        <p className="text-muted-foreground mb-4">
          Le nouveau système vous permet de sélectionner d'abord un laboratoire, puis de voir uniquement les produits
          disponibles dans ce laboratoire.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</div>
            <span>Choisir le laboratoire</span>
          </div>
          <div className="w-4 h-px bg-muted-foreground"></div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</div>
            <span>Sélectionner les produits</span>
          </div>
          <div className="w-4 h-px bg-muted-foreground"></div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</div>
            <span>Finaliser la commande</span>
          </div>
        </div>
      </div>

      <LaboratoryOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateOrder={handleCreateOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
