import { createClient } from "@libsql/client"

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set")
}

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export interface Pose {
  id: number
  name: string
  preview_url: string
  uid: string
  mpl: string
  author: string
  created_at: string
}

export async function getPoses(limit = 50, offset = 0): Promise<Pose[]> {
  const result = await turso.execute({
    sql: "SELECT * FROM pose ORDER BY created_at DESC LIMIT ? OFFSET ?",
    args: [limit, offset],
  })

  return result.rows as unknown as Pose[]
}

export async function getPose(id: string): Promise<Pose | null> {
  const result = await turso.execute({
    sql: "SELECT * FROM pose WHERE id = ?",
    args: [id],
  })

  return (result.rows[0] as unknown as Pose) || null
}

export async function createPose(poseData: Omit<Pose, "id" | "created_at">): Promise<Pose> {
  const now = new Date().toISOString()

  const result = await turso.execute({
    sql: `
      INSERT INTO pose (name, preview_url, uid, mpl, author, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [poseData.name, poseData.preview_url, poseData.uid, poseData.mpl, poseData.author, now],
  })

  return result.rows[0] as unknown as Pose
}

export async function getPosesByAuthor(author: string, limit = 20): Promise<Pose[]> {
  const result = await turso.execute({
    sql: "SELECT * FROM pose WHERE author = ? ORDER BY created_at DESC LIMIT ?",
    args: [author, limit],
  })

  return result.rows as unknown as Pose[]
}
