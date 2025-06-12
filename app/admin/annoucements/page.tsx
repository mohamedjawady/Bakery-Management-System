"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Bell,
  MessageCircle,
  Plus,
  Search,
  Send,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Pin,
  Clock,
  Filter,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAnnouncements } from "@/hooks/useAnnouncements"
import { type Announcement, announcementAPI } from "@/lib/api/announcements"

interface CurrentUser {
  id: string
  name: string
  role: "admin" | "delivery" | "bakery"
}

// Comment form component
const CommentForm = ({
  announcementId,
  onSubmit,
  loading,
  initialValue = "",
  rows = 2,
}: {
  announcementId: string
  onSubmit: (id: string, text: string) => void
  loading: string | null
  initialValue?: string
  rows?: number
}) => {
  const [commentText, setCommentText] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      onSubmit(announcementId, commentText)
      setCommentText("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Ajouter un commentaire..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows={rows}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!commentText.trim() || loading === announcementId}>
          {loading === announcementId ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Commenter
        </Button>
      </div>
    </form>
  )
}

// Create announcement dialog component
const CreateAnnouncementDialog = ({
  isOpen,
  onOpenChange,
  announcementForm,
  setAnnouncementForm,
  createLoading,
  handleCreateAnnouncement,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  announcementForm: {
    title: string
    content: string
    priority: "low" | "medium" | "high" | "urgent"
    category: "general" | "delivery" | "system" | "maintenance"
    isPinned: boolean
  }
  setAnnouncementForm: React.Dispatch<
    React.SetStateAction<{
      title: string
      content: string
      priority: "low" | "medium" | "high" | "urgent"
      category: "general" | "delivery" | "system" | "maintenance"
      isPinned: boolean
    }>
  >
  createLoading: boolean
  handleCreateAnnouncement: () => void
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Créer une nouvelle annonce</DialogTitle>
        <DialogDescription>Rédigez une annonce qui sera visible par tous les utilisateurs</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleCreateAnnouncement()
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Titre de l'annonce"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              placeholder="Contenu de l'annonce"
              rows={4}
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, content: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) e.preventDefault()
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={announcementForm.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setAnnouncementForm((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={announcementForm.category}
                onValueChange={(value: "general" | "delivery" | "system" | "maintenance") =>
                  setAnnouncementForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={announcementForm.isPinned}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isPinned">Épingler cette annonce</Label>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={createLoading}>
            {createLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Publier l'annonce
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
)

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [isAnnouncementDetailsOpen, setIsAnnouncementDetailsOpen] = useState(false)
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false)
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set())
  const [newComment, setNewComment] = useState("")
  const [commentLoading, setCommentLoading] = useState<string | null>(null)

  // Mock current user - replace with actual user context
  // const [currentUser] = useState<CurrentUser>({
  //   id: "user-1",
  //   name: "Jean Dupont",
  //   role: "admin",
  // })

  // Get user from localStorage
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    // Default user in case localStorage is not available (for SSR)
    const defaultUser: CurrentUser = {
      id: "",
      name: "",
      role: "admin",
    }

    // Only access localStorage on client side
    if (typeof window !== "undefined") {
      try {
        const userInfoString = localStorage.getItem("userInfo")
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString)
          return {
            id: userInfo._id || "",
            name: `${userInfo.firstName} ${userInfo.lastName}` || "",
            role: userInfo.role || "admin",
          }
        }
      } catch (error) {
        console.error("Error parsing user info from localStorage:", error)
      }
    }

    return defaultUser
  })

  // Load user data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userInfoString = localStorage.getItem("userInfo")
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString)
          setCurrentUser({
            id: userInfo._id || "",
            name: `${userInfo.firstName} ${userInfo.lastName}` || "",
            role: userInfo.role || "admin",
          })
        }
      } catch (error) {
        console.error("Error parsing user info from localStorage:", error)
      }
    }
  }, [])

  // Form state for creating announcements
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "medium" as Announcement["priority"],
    category: "general" as Announcement["category"],
    isPinned: false,
  })
  const [createLoading, setCreateLoading] = useState(false)

  const { toast } = useToast()

  // Use the custom hook
  const { announcements, loading, error, pagination, updateFilters, addComment, markAsRead, refetch } =
    useAnnouncements({
      userId: currentUser.id,
      limit: 10,
    })

  // Update filters when search term or active tab changes
  useEffect(() => {
    const newFilters: any = {
      userId: currentUser.id,
      page: 1,
    }

    if (searchTerm) {
      newFilters.search = searchTerm
    }

    if (activeTab !== "all") {
      if (activeTab === "pinned") {
        newFilters.isPinned = true
      } else if (activeTab !== "unread") {
        newFilters.category = activeTab
      }
    }

    const timeoutId = setTimeout(() => {
      updateFilters(newFilters)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, activeTab, currentUser.id, updateFilters])

  useEffect(() => {
    refetch()
  }, [])

  // Filter announcements for unread (client-side filtering for unread)
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (activeTab === "unread") {
      return !announcement.isRead
    }
    return true
  })

  // Sort announcements (pinned first, then by date)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Toggle announcement expansion
  const toggleAnnouncementExpansion = (announcementId: string) => {
    const newExpanded = new Set(expandedAnnouncements)
    if (newExpanded.has(announcementId)) {
      newExpanded.delete(announcementId)
    } else {
      newExpanded.add(announcementId)
      markAsRead(announcementId, currentUser.id)
    }
    setExpandedAnnouncements(newExpanded)
  }

  // Create announcement
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      setCreateLoading(true)

      const response = await announcementAPI.createAnnouncement({
        ...announcementForm,
        authorId: currentUser.id,
        authorName: currentUser.name,
      })

      if (response.success) {
        setAnnouncementForm({
          title: "",
          content: "",
          priority: "medium",
          category: "general",
          isPinned: false,
        })
        setIsCreateAnnouncementOpen(false)
        refetch()

        toast({
          title: "Annonce créée",
          description: "L'annonce a été publiée avec succès",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'annonce",
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  // Add comment
  const handleAddComment = async (announcementId: string, commentText: string = newComment) => {
    if (!commentText.trim()) return

    try {
      setCommentLoading(announcementId)
      await addComment(announcementId, commentText, currentUser.id, currentUser.name, currentUser.role)
      setNewComment("")
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setCommentLoading(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Il y a ${diffInDays}j`
    return formatDate(dateString)
  }

  // Get priority badge
  const getPriorityBadge = (priority: Announcement["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        )
      case "high":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
            Haute
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            Moyenne
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
            Faible
          </Badge>
        )
    }
  }

  // Get category badge
  const getCategoryBadge = (category: Announcement["category"]) => {
    const categoryLabels = {
      general: "Général",
      delivery: "Livraison",
      system: "Système",
      maintenance: "Maintenance",
    }

    return (
      <Badge variant="outline" className="text-xs">
        {categoryLabels[category]}
      </Badge>
    )
  }

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        )
      case "delivery":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            Livreur
          </Badge>
        )
      case "bakery":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            Boulangerie
          </Badge>
        )
      default:
        return null
    }
  }

  // Mobile filters
  const MobileFilters = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Filtrer les annonces</h3>
          <div className="space-y-2">
            {[
              { value: "all", label: "Toutes" },
              { value: "pinned", label: "Épinglées" },
              { value: "unread", label: "Non lues" },
              { value: "general", label: "Général" },
              { value: "delivery", label: "Livraison" },
              { value: "system", label: "Système" },
              { value: "maintenance", label: "Maintenance" },
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Announcement card component
  const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
    const isExpanded = expandedAnnouncements.has(announcement._id)

    return (
      <Card
        className={`w-full transition-all duration-200 ${
          announcement.isPinned ? "border-l-4 border-l-blue-500 shadow-md" : ""
        } ${!announcement.isRead ? "bg-blue-50/30 border-blue-200" : ""} hover:shadow-lg`}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {announcement.isPinned && <Pin className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                  {!announcement.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  <CardTitle className="text-base sm:text-lg leading-tight break-words">{announcement.title}</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getPriorityBadge(announcement.priority)}
                  {getCategoryBadge(announcement.category)}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{announcement.authorName}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">{getRelativeTime(announcement.createdAt)}</span>
                  </div>
                </div>
              </div>
              {currentUser.role === "admin" && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <CardDescription className="text-sm leading-relaxed break-words">{announcement.content}</CardDescription>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {announcement.comments.length} commentaire{announcement.comments.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAnnouncement(announcement)
                    setIsAnnouncementDetailsOpen(true)
                    markAsRead(announcement._id, currentUser.id)
                  }}
                  className="whitespace-nowrap"
                >
                  Voir détails
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <Collapsible open={isExpanded} onOpenChange={() => toggleAnnouncementExpansion(announcement._id)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-6 py-2 hover:bg-muted/50">
              <span className="text-sm">
                {announcement.comments.length > 0
                  ? `Voir les commentaires (${announcement.comments.length})`
                  : "Ajouter un commentaire"}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Comments */}
                {announcement.comments.length > 0 && (
                  <div className="space-y-3">
                    {announcement.comments.map((comment) => (
                      <Card key={comment._id} className="border-l-4 border-l-gray-200">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarFallback className="text-xs">
                                    {comment.authorName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">{comment.authorName}</span>
                                {getRoleBadge(comment.authorRole)}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed break-words">{comment.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Add comment */}
                <CommentForm announcementId={announcement._id} onSubmit={handleAddComment} loading={commentLoading} />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role={currentUser.role}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement des annonces...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={currentUser.role}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Annonces</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Restez informé des dernières actualités et mises à jour
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            {currentUser.role === "admin" && (
              <Button onClick={() => setIsCreateAnnouncementOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle annonce
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erreur lors du chargement: {error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 md:hidden">
            <MobileFilters />
            <div className="text-sm text-muted-foreground">
              {sortedAnnouncements.length} annonce{sortedAnnouncements.length !== 1 ? "s" : ""}
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Toutes ({announcements.length})
                </TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs sm:text-sm">
                  Épinglées ({announcements.filter((a) => a.isPinned).length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs sm:text-sm">
                  Non lues ({announcements.filter((a) => !a.isRead).length})
                </TabsTrigger>
                <TabsTrigger value="delivery" className="text-xs sm:text-sm">
                  Livraison
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs sm:text-sm">
                  Système
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Rechercher une annonce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </Tabs>

          <div className="flex items-center gap-2 md:hidden">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Announcements Content */}
        <div className="space-y-4">
          {sortedAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2 text-center">
                  {announcements.length === 0
                    ? "Aucune annonce disponible"
                    : "Aucune annonce trouvée pour les critères sélectionnés"}
                </p>
                {announcements.length === 0 && currentUser.role === "admin" && (
                  <Button onClick={() => setIsCreateAnnouncementOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer la première annonce
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement._id} announcement={announcement} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: pagination.currentPage - 1 })}
              disabled={pagination.currentPage === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: pagination.currentPage + 1 })}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Announcement Details Dialog */}
        <Dialog open={isAnnouncementDetailsOpen} onOpenChange={setIsAnnouncementDetailsOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {selectedAnnouncement?.isPinned && <Pin className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                <span className="break-words">{selectedAnnouncement?.title}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedAnnouncement && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getPriorityBadge(selectedAnnouncement.priority)}
                    {getCategoryBadge(selectedAnnouncement.category)}
                    <span className="text-sm">
                      Par {selectedAnnouncement.authorName} • {formatDate(selectedAnnouncement.createdAt)}
                    </span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedAnnouncement && (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="break-words leading-relaxed">{selectedAnnouncement.content}</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Commentaires ({selectedAnnouncement.comments.length})</h3>

                  {selectedAnnouncement.comments.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedAnnouncement.comments.map((comment) => (
                        <Card key={comment._id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback>
                                      {comment.authorName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium truncate">{comment.authorName}</span>
                                      {getRoleBadge(comment.authorRole)}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(comment.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm break-words leading-relaxed">{comment.content}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aucun commentaire pour le moment</p>
                  )}

                  {/* Comment form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddComment(selectedAnnouncement._id)
                    }}
                    className="space-y-2"
                  >
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault()
                          handleAddComment(selectedAnnouncement._id)
                        }
                      }}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!newComment.trim() || commentLoading === selectedAnnouncement._id}
                      >
                        {commentLoading === selectedAnnouncement._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Publier le commentaire
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnnouncementDetailsOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Announcement Dialog */}
        <CreateAnnouncementDialog
          isOpen={isCreateAnnouncementOpen}
          onOpenChange={setIsCreateAnnouncementOpen}
          announcementForm={announcementForm}
          setAnnouncementForm={setAnnouncementForm}
          createLoading={createLoading}
          handleCreateAnnouncement={handleCreateAnnouncement}
        />
      </div>
    </DashboardLayout>
  )
}
