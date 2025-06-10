"use client"

import { useState, useEffect, useCallback } from "react"
import { announcementAPI, type Announcement, type AnnouncementFilters } from "@/lib/api/announcements"
import { useToast } from "@/hooks/use-toast"

export function useAnnouncements(initialFilters: AnnouncementFilters = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters)

  const { toast } = useToast()

  const fetchAnnouncements = useCallback(
    async (newFilters?: AnnouncementFilters) => {
      try {
        setLoading(true)
        setError(null)

        const filtersToUse = newFilters || filters
        const response = await announcementAPI.getAnnouncements(filtersToUse)

        if (response.success) {
          setAnnouncements(response.data)
          if (response.pagination) {
            setPagination(response.pagination)
          }
        } else {
          throw new Error(response.message || "Failed to fetch announcements")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch announcements"
        setError(errorMessage)
        toast({
          title: "Erreur",
          description: "Impossible de charger les annonces",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [filters, toast],
  )

  const updateFilters = useCallback((newFilters: Partial<AnnouncementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const addComment = useCallback(
    async (announcementId: string, content: string, authorId: string, authorName: string, authorRole: string) => {
      try {
        const response = await announcementAPI.addComment(announcementId, {
          content,
          authorId,
          authorName,
          authorRole,
        })

        if (response.success) {
          // Update the local state
          setAnnouncements((prev) =>
            prev.map((announcement) =>
              announcement._id === announcementId
                ? { ...announcement, comments: [...announcement.comments, response.data] }
                : announcement,
            ),
          )

          toast({
            title: "Commentaire ajouté",
            description: "Votre commentaire a été publié avec succès",
          })

          return response.data
        } else {
          throw new Error(response.message || "Failed to add comment")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add comment"
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le commentaire",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast],
  )

  const markAsRead = useCallback(async (announcementId: string, userId: string) => {
    try {
      await announcementAPI.markAsRead(announcementId, userId)

      // Update local state
      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement._id === announcementId ? { ...announcement, isRead: true } : announcement,
        ),
      )
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements(filters)
  }, [filters, fetchAnnouncements])

  return {
    announcements,
    loading,
    error,
    pagination,
    filters,
    fetchAnnouncements,
    updateFilters,
    addComment,
    markAsRead,
    refetch: () => fetchAnnouncements(),
  }
}
