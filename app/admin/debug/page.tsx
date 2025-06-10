"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConnectionTest } from "@/components/ConnectionTest"
import { announcementAPI } from "@/lib/api/announcements"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function DebugPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results = []

    // Test 1: Health check
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/health`)
      const data = await response.json()
      results.push({
        test: "Health Check",
        status: "success",
        data: data,
        url: "/health",
      })
    } catch (error) {
      results.push({
        test: "Health Check",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        url: "/health",
      })
    }

    // Test 2: Test endpoint
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/test`)
      const data = await response.json()
      results.push({
        test: "Test Endpoint",
        status: "success",
        data: data,
        url: "/api/test",
      })
    } catch (error) {
      results.push({
        test: "Test Endpoint",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        url: "/api/test",
      })
    }

    // Test 3: Announcements endpoint
    try {
      const response = await announcementAPI.getAnnouncements()
      results.push({
        test: "Announcements API",
        status: "success",
        data: response,
        url: "/api/announcements",
      })
    } catch (error) {
      results.push({
        test: "Announcements API",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        url: "/api/announcements",
      })
    }

    setTestResults(results)
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">Test your backend connection and API endpoints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConnectionTest />

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Current environment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Backend URL:</p>
                <Badge variant="outline">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Environment:</p>
                <Badge variant="outline">{process.env.NODE_ENV || "development"}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Tests</CardTitle>
            <CardDescription>Test individual API endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} disabled={testing} className="w-full">
              {testing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run All Tests"
              )}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <h3 className="font-semibold">Test Results</h3>
                {testResults.map((result, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {result.test}
                        <Badge variant="outline" className="ml-auto">
                          {result.url}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.status === "success" ? (
                        <div className="space-y-2">
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>Test passed successfully</AlertDescription>
                          </Alert>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Check Backend Server</h4>
              <p className="text-sm text-muted-foreground">Make sure your Express.js server is running on port 5000:</p>
              <code className="block bg-gray-100 p-2 rounded text-sm">cd your-backend-folder && npm start</code>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Verify Environment Variables</h4>
              <p className="text-sm text-muted-foreground">Create a .env.local file in your Next.js project root:</p>
              <code className="block bg-gray-100 p-2 rounded text-sm">NEXT_PUBLIC_API_URL=http://localhost:5000</code>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Test Backend Directly</h4>
              <p className="text-sm text-muted-foreground">Open these URLs in your browser:</p>
              <ul className="text-sm space-y-1">
                <li>
                  •{" "}
                  <a
                    href="http://localhost:5000/health"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    http://localhost:5000/health
                  </a>
                </li>
                <li>
                  •{" "}
                  <a
                    href="http://localhost:5000/api/test"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    http://localhost:5000/api/test
                  </a>
                </li>
                <li>
                  •{" "}
                  <a
                    href="http://localhost:5000/api/announcements"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    http://localhost:5000/api/announcements
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
