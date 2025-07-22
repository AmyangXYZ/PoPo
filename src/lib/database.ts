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
  mpl: string
  aiModel?: string
  temperature?: number
  topP?: number
}

export async function savePoseAnalysis(analysis: PoseAnalysis): Promise<void> {
  try {
    if (!analysis) {
      console.log("Analysis object is missing - skipping save")
      return
    }

    if (!client) {
      console.log("Turso not configured - skipping pose analysis save")
      return
    }

    // Safely serialize the result
    let resultJson: string
    try {
      resultJson = JSON.stringify(analysis.mpl)
    } catch (jsonError) {
      console.log("Failed to serialize analysis result - skipping save:", jsonError)
      return
    }

    await client.execute({
      sql: `INSERT INTO pose_analyses 
            (description, result, ai_model, temperature, top_p) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        analysis.description || "",
        resultJson,
        analysis.aiModel || null,
        analysis.temperature || null,
        analysis.topP || null,
      ],
    })
  } catch (error) {
    console.log("Failed to save pose analysis - continuing silently:", error)
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
