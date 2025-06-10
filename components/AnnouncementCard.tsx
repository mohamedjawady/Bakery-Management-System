"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"

// Create a separate component for the comment form
const CommentForm = ({ announcementId, onSubmit, loading }) => {
  const [commentText, setCommentText] = useState("")

  const handleSubmit = (e) => {
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
        rows={2}
        className="resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!commentText.trim() || loading === announcementId} className="gap-2">
          {loading === announcementId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Commenter
        </Button>
      </div>
    </form>
  )
}

export default CommentForm
