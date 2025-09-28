import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const externalApiUrl = process.env.EXTERNAL_DELIVERIES_API_URL || "/api/deliveries"
    const response = await fetch(`${externalApiUrl}/${id}`)

    if (!response.ok) {
      console.error(`Error fetching single delivery from external API: ${response.status} ${response.statusText}`)
      return new NextResponse(JSON.stringify({ error: "Failed to fetch delivery from external API" }), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const delivery = await response.json()
    return NextResponse.json(delivery)
  } catch (error) {
    console.error(`Error in /api/deliveries/${id} Route Handler:`, error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
