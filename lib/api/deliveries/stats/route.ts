import { NextResponse } from "next/server"
import type { Delivery } from "@/lib/api/deliveriess"

// This Route Handler calculates and returns delivery statistics
export async function GET() {
  try {
    const externalApiUrl = process.env.EXTERNAL_DELIVERIES_API_URL || "/api/deliveries"
    const response = await fetch(externalApiUrl)

    if (!response.ok) {
      console.error(`Error fetching from external API for stats: ${response.status} ${response.statusText}`)
      return new NextResponse(JSON.stringify({ error: "Failed to fetch deliveries for stats from external API" }), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const deliveries: Delivery[] = await response.json()

    const ready = deliveries.filter((d) => d.status === "READY_FOR_DELIVERY").length
    const inTransit = deliveries.filter((d) => d.status === "IN_TRANSIT").length
    const delivered = deliveries.filter((d) => d.status === "DELIVERED").length
    const total = deliveries.length

    return NextResponse.json({ total, ready, inTransit, delivered })
  } catch (error) {
    console.error("Error in /api/deliveries/stats Route Handler:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
