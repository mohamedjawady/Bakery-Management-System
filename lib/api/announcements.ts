const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export interface Comment {
  _id: string
  content: string
  authorId: string
  authorName: string
  authorRole: "admin" | "delivery" | "bakery" | "laboratory"
  createdAt: string
  updatedAt?: string
}

export interface Announcement {
  _id: string
  title: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  category: "general" | "delivery" | "system" | "maintenance"
  isPinned: boolean
  authorId: string
  authorName: string
  createdAt: string
  updatedAt?: string
  comments: Comment[]
  isRead?: boolean
  commentCount?: number
}

export interface AnnouncementFilters {
  page?: number
  limit?: number
  category?: string
  priority?: string
  isPinned?: boolean
  search?: string
  userId?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

class AnnouncementAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      console.log("Making API request to:", url)

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response received:", text.substring(0, 200))
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server. Please check if the backend is running.")
      }

      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return response.ok
    } catch (error) {
      console.error("Connection test failed:", error)
      return false
    }
  }

  async getAnnouncements(filters: AnnouncementFilters = {}): Promise<ApiResponse<Announcement[]>> {
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/api/announcements${queryString ? `?${queryString}` : ""}`

    return this.request<Announcement[]>(endpoint)
  }

  async getAnnouncementById(id: string, userId?: string): Promise<ApiResponse<Announcement>> {
    const queryParams = userId ? `?userId=${userId}` : ""
    return this.request<Announcement>(`/api/announcements/${id}${queryParams}`)
  }

  async createAnnouncement(announcement: {
    title: string
    content: string
    priority: string
    category: string
    isPinned: boolean
    authorId: string
    authorName: string
  }): Promise<ApiResponse<Announcement>> {
    return this.request<Announcement>("/api/announcements", {
      method: "POST",
      body: JSON.stringify(announcement),
    })
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    return this.request<Announcement>(`/api/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/announcements/${id}`, {
      method: "DELETE",
    })
  }

  async addComment(
    announcementId: string,
    comment: {
      content: string
      authorId: string
      authorName: string
      authorRole: string
    },
  ): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/api/announcements/${announcementId}/comments`, {
      method: "POST",
      body: JSON.stringify(comment),
    })
  }

  async updateComment(
    announcementId: string,
    commentId: string,
    content: string,
    authorId: string,
  ): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/api/announcements/${announcementId}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content, authorId }),
    })
  }

  async deleteComment(
    announcementId: string,
    commentId: string,
    authorId: string,
    userRole: string,
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/announcements/${announcementId}/comments/${commentId}`, {
      method: "DELETE",
      body: JSON.stringify({ authorId, userRole }),
    })
  }

  async markAsRead(announcementId: string, userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/announcements/${announcementId}/read`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async getStats(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/announcements/stats")
  }
}

export const announcementAPI = new AnnouncementAPI()
