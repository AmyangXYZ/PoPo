import { poseCache } from "@/lib/cache"
import { savePoseAnalysis } from "@/lib/database"
import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const systemPrompt = `Generate MMD Pose Language (MPL) script from description.`

const userPrompt = `Description: {description}`

export async function POST(request: Request) {
  if (
    !process.env.AI_MODEL ||
    !process.env.AI_API_KEY ||
    !process.env.AI_API_BASE_URL ||
    !process.env.TEMPERATURE ||
    !process.env.TOP_P
  ) {
    return Response.json({ error: "Missing required environment variables" }, { status: 500 })
  }

  try {
    const { description } = await request.json()

    const provider = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_API_BASE_URL,
    })

    // Check cache first
    const cachedResult = await poseCache.get(
      description,
      process.env.AI_MODEL!,
      parseFloat(process.env.TEMPERATURE),
      parseFloat(process.env.TOP_P)
    )

    if (cachedResult) {
      // Save to database for analysis (non-blocking)
      savePoseAnalysis({
        description,
        mpl: cachedResult,
        aiModel: process.env.AI_MODEL,
        temperature: parseFloat(process.env.TEMPERATURE),
        topP: parseFloat(process.env.TOP_P),
      })
      return Response.json({
        result: cachedResult,
        cached: true,
      })
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userPrompt.replace("{description}", description),
      },
    ]

    const response = await provider.chat.completions.create({
      model: process.env.AI_MODEL,
      messages,
      temperature: parseFloat(process.env.TEMPERATURE),
      top_p: parseFloat(process.env.TOP_P),
    })

    const mpl = response.choices[0].message.content ?? ""

    await poseCache.set(
      description,
      mpl,
      process.env.AI_MODEL!,
      parseFloat(process.env.TEMPERATURE),
      parseFloat(process.env.TOP_P)
    )

    // Save to database for analysis (non-blocking)
    savePoseAnalysis({
      description,
      mpl: mpl,
      aiModel: process.env.AI_MODEL,
      temperature: parseFloat(process.env.TEMPERATURE),
      topP: parseFloat(process.env.TOP_P),
    })

    return Response.json({
      mpl: mpl,
      cached: false,
    })
  } catch (error) {
    console.log("Error generating pose:", error)
    return Response.json({ error: "Failed to generate pose", mpl: "" }, { status: 500 })
  }
}
