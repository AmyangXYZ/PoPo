import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 4.5 * 1024 * 1024) {
      return new NextResponse("File size must be less than 4.5MB", { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading image:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
