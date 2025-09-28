import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { status, notes } = await request.json()
    console.log("Proxying PUT request to external API:")
    console.log("  ID:", id)
    console.log("  Status:", status)
    console.log("  Notes:", notes)
    console.log("  Payload being sent:", JSON.stringify({ status, notes }))
    const externalApiUrl = process.env.EXTERNAL_DELIVERIES_API_URL || "/api/deliveries"

    const response = await fetch(`${externalApiUrl}/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, notes }),
    })

    if (!response.ok) {
      console.error(`Error updating status on external API: ${response.status} ${response.statusText}`)
      return new NextResponse(JSON.stringify({ error: "Failed to update delivery status on external API" }), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const updatedDelivery = await response.json()
    return NextResponse.json(updatedDelivery)
  } catch (error) {
    console.error(`Error in /api/deliveries/${id}/status Route Handler:`, error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
