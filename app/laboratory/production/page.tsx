"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, CookingPot, PackageCheck } from "lucide-react";
import { useState } from "react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface ProductionOrder {
  id: string;
  referenceId: string;
  bakeryName: string;
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_DELIVERY";
  items: OrderItem[];
}

const initialOrders: ProductionOrder[] = [
  {
    id: "1",
    referenceId: "CMD-001",
    bakeryName: "Boulangerie Saint-Michel",
    status: "PENDING",
    items: [
      { id: "p1", name: "Baguette Tradition", quantity: 25 },
      { id: "p2", name: "Pain au Chocolat", quantity: 40 },
      { id: "p3", name: "Croissant", quantity: 30 },
    ],
  },
  {
    id: "2",
    referenceId: "CMD-002",
    bakeryName: "Boulangerie Montmartre",
    status: "PENDING",
    items: [
      { id: "p4", name: "Pain de Campagne", quantity: 15 },
      { id: "p1", name: "Baguette Tradition", quantity: 20 },
    ],
  },
  {
    id: "3",
    referenceId: "CMD-003",
    bakeryName: "Boulangerie Opéra",
    status: "IN_PROGRESS",
    items: [
      { id: "p5", name: "Tarte aux Pommes", quantity: 5 },
      { id: "p2", name: "Pain au Chocolat", quantity: 20 },
    ],
  },
  {
    id: "4",
    referenceId: "CMD-004",
    bakeryName: "Boulangerie Le Marais",
    status: "IN_PROGRESS",
    items: [
      { id: "p1", name: "Baguette Tradition", quantity: 50 },
      { id: "p6", name: "Éclair au Café", quantity: 24 },
    ],
  },
  {
    id: "5",
    referenceId: "CMD-005",
    bakeryName: "Boulangerie Bastille",
    status: "READY_FOR_DELIVERY",
    items: [
      { id: "p3", name: "Croissant", quantity: 60 },
      { id: "p7", name: "Pain aux Raisins", quantity: 30 },
    ],
  },
];

const KanbanColumn = ({ title, orders, status, onUpdateStatus, icon: Icon }: { title: string; orders: ProductionOrder[]; status: ProductionOrder['status']; onUpdateStatus: (orderId: string, newStatus: ProductionOrder['status']) => void; icon: React.ElementType }) => {
  const filteredOrders = orders.filter(order => order.status === status);

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{title} ({filteredOrders.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4 h-[calc(100vh-220px)] overflow-y-auto">
        {filteredOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune commande ici.</p>}
        {filteredOrders.map((order) => (
          <Card key={order.id} className="bg-muted/30 dark:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{order.referenceId}</CardTitle>
                <Badge variant={
                  order.status === "PENDING" ? "outline" :
                  order.status === "IN_PROGRESS" ? "secondary" :
                  "default" // READY_FOR_DELIVERY
                }>{order.bakeryName}</Badge>
              </div>
              <CardDescription>
                {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-3">
              <p className="font-medium mb-1">Articles:</p>
              <ul className="list-disc list-inside pl-1 space-y-1 max-h-24 overflow-y-auto">
                {order.items.map((item) => (
                  <li key={item.id} className="text-xs">
                    {item.name} <span className="font-semibold">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2 border-t">
              {order.status === "PENDING" && (
                <Button size="sm" className="w-full" onClick={() => onUpdateStatus(order.id, "IN_PROGRESS")}>
                  Démarrer Production <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => onUpdateStatus(order.id, "READY_FOR_DELIVERY")}>
                  Marquer comme Prêt <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
              {order.status === "READY_FOR_DELIVERY" && (
                 <p className="text-xs text-green-600 flex items-center w-full justify-center">
                    <PackageCheck className="mr-2 h-4 w-4" /> Prêt pour livraison
                 </p>
              )}
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default function LaboratoryProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);

  const handleUpdateStatus = (orderId: string, newStatus: ProductionOrder['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <DashboardLayout role="laboratory">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suivi de Production</h1>
            <p className="text-muted-foreground">
              Gérez l'état d'avancement des commandes en laboratoire.
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          <KanbanColumn 
            title="À Produire" 
            orders={orders} 
            status="PENDING" 
            onUpdateStatus={handleUpdateStatus}
            icon={CookingPot} 
          />
          <KanbanColumn 
            title="En Production" 
            orders={orders} 
            status="IN_PROGRESS" 
            onUpdateStatus={handleUpdateStatus}
            icon={CookingPot} // Could use a different icon like Zap or Hourglass
          />
          <KanbanColumn 
            title="Prêt pour Livraison" 
            orders={orders} 
            status="READY_FOR_DELIVERY" 
            onUpdateStatus={handleUpdateStatus} // No action from here in this simple model
            icon={PackageCheck}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
