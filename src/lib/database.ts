import { createClient } from "@libsql/client"

const isTursoConfigured = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)

const client = isTursoConfigured
  ? createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
  : null

export interface PoseAnalysis {
  description: string
  result: {
    description: string
    face: unknown[]
    movableBones: unknown[]
    rotatableBones: unknown[]
  }
  aiModel?: string
  temperature?: number
  topP?: number
  rawResponse?: string
}

export async function savePoseAnalysis(analysis: PoseAnalysis) {
  if (!client) {
    console.log("Turso not configured - skipping pose analysis save")
    return { success: false, error: "Database not configured" }
  }

  try {
    const result = await client.execute({
      sql: `INSERT INTO pose_analyses 
            (description, result, ai_model, temperature, top_p, raw_response) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        analysis.description,
        JSON.stringify(analysis.result),
        analysis.aiModel || null,
        analysis.temperature || null,
        analysis.topP || null,
        analysis.rawResponse || null,
      ],
    })
    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    console.error("Failed to save pose analysis:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getPoseAnalyses(limit = 100) {
  if (!client) {
    console.log("Turso not configured - cannot retrieve pose analyses")
    return []
  }

  try {
    const result = await client.execute({
      sql: `SELECT * FROM pose_analyses ORDER BY created_at DESC LIMIT ?`,
      args: [limit],
    })

    return result.rows.map((row) => ({
      ...row,
      result: JSON.parse(row.result as string),
    }))
  } catch (error) {
    console.error("Failed to get pose analyses:", error)
    return []
  }
}
