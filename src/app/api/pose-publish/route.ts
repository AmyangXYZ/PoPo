import { NextResponse } from "next/server"
import { currentUser, auth } from "@clerk/nextjs/server"
import { createPose } from "@/lib/database"

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Validate request body
    const { uid, name, preview_url, mpl } = await req.json()

    if (!uid || typeof uid !== "string") {
      return new NextResponse("Invalid pose UID", { status: 400 })
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new NextResponse("Invalid pose name", { status: 400 })
    }

    if (!preview_url || typeof preview_url !== "string") {
      return new NextResponse("Invalid preview URL", { status: 400 })
    }

    if (!mpl || typeof mpl !== "string") {
      return new NextResponse("Invalid MPL statement", { status: 400 })
    }

    // Create pose in database
    await createPose({
      name: name.trim(),
      preview_url,
      mpl,
      uid,
      author: user.username || "mikumiku",
    })

    return new NextResponse(JSON.stringify({ success: true }), { status: 201 })
  } catch (error) {
    console.error("Error creating pose:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
