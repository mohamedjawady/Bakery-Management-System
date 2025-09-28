"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { announcementAPI } from "@/lib/api/announcements"

export function ConnectionTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setError(null)

    try {
      const connected = await announcementAPI.testConnection()
      setIsConnected(connected)

      if (!connected) {
        setError("Unable to connect to the backend server")
      }
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : "Connection test failed")
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected === true && <CheckCircle className="h-5 w-5 text-green-500" />}
          {isConnected === false && <XCircle className="h-5 w-5 text-red-500" />}
          {isConnected === null && <RefreshCw className="h-5 w-5 animate-spin" />}
          Connection Status
        </CardTitle>
        <CardDescription>Testing connection to backend server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected === true && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Successfully connected to backend server</AlertDescription>
          </Alert>
        )}

        {isConnected === false && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error || "Failed to connect to backend server"}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || ""}
          </p>
          <p>
            <strong>Health Check:</strong> /health
          </p>
          <p>
            <strong>Announcements API:</strong> /api/announcements
          </p>
        </div>

        <Button onClick={testConnection} disabled={testing} className="w-full">
          {testing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
