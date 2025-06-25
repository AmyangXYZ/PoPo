import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
const baseUrl = process.env.R2_BASE_URL

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !baseUrl) {
  throw new Error("Missing required R2 environment variables")
}

const s3Client = new S3Client({
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  region: "auto",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export async function GET(request: Request) {
  try {
    const filename = new URL(request.url).searchParams.get("filename")
    if (!filename) return Response.json({ error: "Filename required" }, { status: 400 })

    const key = `${Date.now()}-${filename}`
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 })

    return Response.json({
      uploadUrl, // Use this URL to upload the file from the browser
      fileUrl: `${baseUrl}/${key}`, // Public URL to access the file after upload
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return Response.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }
}
