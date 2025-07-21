"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  UserX,
  Truck,
  AlertCircle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types
interface DeliveryUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  phone?: string
  vehicleType?: string
  vehicleRegistration?: string
}

interface Order {
  _id: string
  orderId: string
  orderReferenceId: string
  bakeryName: string
  deliveryUserId: string
  deliveryUserName: string
  scheduledDate: string
  status: string
  address: string
  createdAt: string
}

interface ValidationIssue {
  orderId: string
  orderReference: string
  issueType: 'INVALID_USER' | 'INACTIVE_USER' | 'MISSING_USER' | 'MISMATCH'
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  deliveryUserId: string
  deliveryUserName: string
}

export default function DeliveryValidationPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastValidation, setLastValidation] = useState<Date | null>(null)
  const { toast } = useToast()

  // Fetch orders and delivery users
  const fetchData = async () => {
    setLoading(true)
    try {
      // Get authentication token
      const userInfo = localStorage.getItem('userInfo')
      const token = userInfo ? JSON.parse(userInfo).token : null
      
      if (!token) {
        throw new Error("Authentication required")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch orders
      const ordersResponse = await fetch("http://localhost:5000/orders", { headers })
      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders")
      }
      const ordersData = await ordersResponse.json()

      // Fetch delivery users
      const usersResponse = await fetch("/api/users", { headers })
      let usersData: DeliveryUser[] = []
      if (usersResponse.ok) {
        const allUsers = await usersResponse.json()
        usersData = allUsers.filter((user: DeliveryUser) => user.role === 'delivery')
      } else {
        console.error("Failed to fetch users:", usersResponse.status)
      }

      setOrders(ordersData)
      setDeliveryUsers(usersData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Validate delivery assignments
  const validateDeliveryAssignments = () => {
    setValidating(true)
    const issues: ValidationIssue[] = []

    orders.forEach(order => {
      // Skip validation for orders that are not assigned yet
      if (!order.deliveryUserId || 
          order.deliveryUserId === 'DISPATCH_PENDING' || 
          order.deliveryUserId.trim() === '') {
        return // Skip unassigned orders
      }

      // Check if deliveryUserId exists in delivery users (by _id or email)
      const assignedUser = deliveryUsers.find(user => 
        user._id === order.deliveryUserId || 
        user.email === order.deliveryUserId
      )
      
      if (!assignedUser) {
        // Check if it's a hardcoded ID that doesn't exist in database
        const hardcodedUsers = ["1", "2", "3", "6", "7", "8"]
        if (hardcodedUsers.includes(order.deliveryUserId)) {
          issues.push({
            orderId: order._id,
            orderReference: order.orderReferenceId,
            issueType: 'INVALID_USER',
            description: `ID de livreur "${order.deliveryUserId}" est codé en dur et n'existe pas dans la base de données`,
            severity: 'HIGH',
            deliveryUserId: order.deliveryUserId,
            deliveryUserName: order.deliveryUserName
          })
        } else if (order.deliveryUserId.includes('@')) {
          // Email-based assignment but user not found
          issues.push({
            orderId: order._id,
            orderReference: order.orderReferenceId,
            issueType: 'MISSING_USER',
            description: `Aucun livreur trouvé avec l'email "${order.deliveryUserId}"`,
            severity: 'HIGH',
            deliveryUserId: order.deliveryUserId,
            deliveryUserName: order.deliveryUserName
          })
        } else {
          issues.push({
            orderId: order._id,
            orderReference: order.orderReferenceId,
            issueType: 'MISSING_USER',
            description: `Livreur avec ID "${order.deliveryUserId}" introuvable dans la base de données`,
            severity: 'HIGH',
            deliveryUserId: order.deliveryUserId,
            deliveryUserName: order.deliveryUserName
          })
        }
      } else {
        // User exists, check if active
        if (!assignedUser.isActive) {
          issues.push({
            orderId: order._id,
            orderReference: order.orderReferenceId,
            issueType: 'INACTIVE_USER',
            description: `Livreur "${assignedUser.firstName} ${assignedUser.lastName}" est inactif`,
            severity: 'MEDIUM',
            deliveryUserId: order.deliveryUserId,
            deliveryUserName: order.deliveryUserName
          })
        }

        // Check name mismatch
        const expectedName = `${assignedUser.firstName} ${assignedUser.lastName}`
        if (order.deliveryUserName !== expectedName) {
          issues.push({
            orderId: order._id,
            orderReference: order.orderReferenceId,
            issueType: 'MISMATCH',
            description: `Nom du livreur ne correspond pas: "${order.deliveryUserName}" vs "${expectedName}"`,
            severity: 'LOW',
            deliveryUserId: order.deliveryUserId,
            deliveryUserName: order.deliveryUserName
          })
        }
      }
    })

    setValidationIssues(issues)
    setLastValidation(new Date())
    setValidating(false)

    toast({
      title: "Validation terminée",
      description: `${issues.length} problème(s) détecté(s)`,
      variant: issues.length > 0 ? "destructive" : "default",
    })
  }

  // Filter issues based on search
  const filteredIssues = validationIssues.filter(issue => 
    issue.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.deliveryUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get issue stats
  const getIssueStats = () => {
    const high = validationIssues.filter(i => i.severity === 'HIGH').length
    const medium = validationIssues.filter(i => i.severity === 'MEDIUM').length
    const low = validationIssues.filter(i => i.severity === 'LOW').length
    return { high, medium, low, total: validationIssues.length }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Élevée</Badge>
      case 'MEDIUM':
        return <Badge variant="outline" className="flex items-center gap-1 border-orange-400 text-orange-600"><AlertTriangle className="h-3 w-3" />Moyenne</Badge>
      case 'LOW':
        return <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 text-yellow-600"><AlertCircle className="h-3 w-3" />Faible</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'INVALID_USER':
        return <UserX className="h-4 w-4 text-red-500" />
      case 'INACTIVE_USER':
        return <XCircle className="h-4 w-4 text-orange-500" />
      case 'MISSING_USER':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'MISMATCH':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stats = getIssueStats()

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement des données...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validation des Affectations de Livraison</h1>
            <p className="text-muted-foreground">
              Vérifiez que les commandes sont assignées aux bons comptes de livraison
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={validateDeliveryAssignments} disabled={validating}>
              {validating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Valider
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryUsers.filter(u => u.isActive).length}</div>
              <p className="text-xs text-muted-foreground">
                sur {deliveryUsers.length} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Problèmes Détectés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              {lastValidation && (
                <p className="text-xs text-muted-foreground">
                  Dernière validation: {lastValidation.toLocaleTimeString('fr-FR')}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Priorité Élevée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.high}</div>
              <p className="text-xs text-muted-foreground">
                {stats.medium} moyennes, {stats.low} faibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Results */}
        {validationIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{stats.total} problème(s) détecté(s)</strong> - 
              {stats.high > 0 && ` ${stats.high} priorité élevée`}
              {stats.medium > 0 && ` ${stats.medium} priorité moyenne`}
              {stats.low > 0 && ` ${stats.low} priorité faible`}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">
              Problèmes Détectés ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="delivery-users">
              Livreurs ({deliveryUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Problèmes d'Affectation</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Commande</TableHead>
                        <TableHead>Livreur Assigné</TableHead>
                        <TableHead>Problème</TableHead>
                        <TableHead>Priorité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIssues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            {validationIssues.length === 0 
                              ? "Aucun problème détecté" 
                              : "Aucun résultat trouvé"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIssues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getIssueTypeIcon(issue.issueType)}
                                <span className="text-xs">{issue.issueType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {issue.orderReference}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{issue.deliveryUserName}</div>
                                <div className="text-xs text-muted-foreground">ID: {issue.deliveryUserId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                {issue.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getSeverityBadge(issue.severity)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery-users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Livreurs Enregistrés</CardTitle>
                <CardDescription>
                  Liste des comptes de livraison dans la base de données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Commandes Assignées</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryUsers.map((user) => {
                        const assignedOrders = orders.filter(o => o.deliveryUserId === user._id)
                        return (
                          <TableRow key={user._id}>
                            <TableCell className="font-mono text-xs">{user._id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                {user.firstName} {user.lastName}
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Actif
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Inactif</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.vehicleType ? (
                                <div>
                                  <div className="text-sm">{user.vehicleType}</div>
                                  {user.vehicleRegistration && (
                                    <div className="text-xs text-muted-foreground">{user.vehicleRegistration}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {assignedOrders.length} commandes
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
