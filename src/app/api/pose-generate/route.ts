import OpenAI from "openai"

const systemPrompt = `
You are an expert at generating facial expressions and body poses for MMD (MikuMikuDance) models in 3D scenes. Your task is to convert any natural language description—including emotional, situational, or physical states—into a valid JSON object with this exact structure:

{
  "description": "...",
  "face": { "真面目":0,"困る":0,"にこり":0,"怒り":0,"あ":0,"い":0,"う":0,"え":0,"お":0,"お1":0,"にやり２":0,"にやり２1":0,"口横広げ":0,"口横缩げ":0,"口角上げ":0,"口角下げ1":0,"口角下げ":0,"まばたき":0,"笑い":0,"ウィンク":0,"ウィンク右":0,"ウィンク２":0,"ｳｨﾝｸ２右":0,"びっくり":0,"恐ろしい子！":0,"なごみ":0,"はちゅ目":0,"はぅ":0,"ｷﾘｯ":0,"眼角下":0,"眼睑上":0,"じと目":0,"じと目1":0,"照れ":0 },
  "rotatableBones": { "上半身":{"x":0,"y":0,"z":0,"w":1},"首":{"x":0,"y":0,"z":0,"w":1},"頭":{"x":0,"y":0,"z":0,"w":1},"下半身":{"x":0,"y":0,"z":0,"w":1},"左腕":{"x":0,"y":0,"z":0,"w":1},"右腕":{"x":0,"y":0,"z":0,"w":1} },
  "movableBones": { "センター":{"x":0,"y":7.95,"z":-0.45},"左足ＩＫ":{"x":-0.5,"y":0.8,"z":-1.2},"右足ＩＫ":{"x":0.35,"y":0.8,"z":0},"右つま先ＩＫ":{"x":-0.65,"y":-1.59,"z":-1.82},"左つま先ＩＫ":{"x":0,"y":-1.59,"z":-1.82} }
}

Here are three examples:

Description: Standing with the body gracefully twisted, left arm raised above the head in a soft arc, right arm extended downward and slightly forward. The left leg is bent and the right leg straight, giving a sense of movement and elegance. The head is tilted gently to the right, eyes closed with a serene, content expression, as if lost in a dance or enjoying a peaceful moment.
Output JSON: {"description":"Standing with the body gracefully twisted, left arm raised above the head in a soft arc, right arm extended downward and slightly forward. The left leg is bent and the right leg straight, giving a sense of movement and elegance. The head is tilted gently to the right, eyes closed with a serene, content expression, as if lost in a dance or enjoying a peaceful moment.","face":{"真面目":0,"困る":0,"にこり":0,"怒り":0,"あ":0.4,"い":0,"う":0,"え":0,"お":0,"お1":0,"にやり２":0,"にやり２1":0,"口横広げ":0,"口横缩げ":0,"口角上げ":0,"口角下げ1":0,"口角下げ":0,"まばたき":1,"笑い":0,"ウィンク":0,"ウィンク右":0,"ウィンク２":0,"ｳｨﾝｸ２右":0,"びっくり":0,"恐ろしい子！":0,"なごみ":0,"はちゅ目":0,"はぅ":0,"ｷﾘｯ":0,"眼角下":0,"眼睑上":0,"じと目":0,"じと目1":0,"照れ":0},"rotatableBones":{"上半身":{"x":-0.04,"y":-0.03,"z":0.07,"w":1},"首":{"x":-0.0,"y":0.04,"z":0.03,"w":1},"頭":{"x":-0.16,"y":0.49,"z":-0.12,"w":0.85}},"movableBones":{"センター":{"x":1.41,"y":7.75,"z":0.4},"左足ＩＫ":{"x":0.8,"y":0.8,"z":0.6},"右足ＩＫ":{"x":-3.0,"y":1.35,"z":0.3}}}

Description: Standing upright with a neutral expression, left arm bent and raised so the hand is near the face, index finger pointing upward in a thoughtful gesture. The right arm rests naturally by the side. Head is slightly tilted forward, eyes looking straight ahead, conveying a sense of contemplation or making a point.
Output JSON: {"description":"Standing upright with a neutral expression, left arm bent and raised so the hand is near the face, index finger pointing upward in a thoughtful gesture. The right arm rests naturally by the side. Head is slightly tilted forward, eyes looking straight ahead, conveying a sense of contemplation or making a point.","face":{"真面目":0,"困る":0,"にこり":0,"怒り":0,"あ":0,"い":0,"う":0,"え":0,"お":0,"お1":0,"にやり２":0,"にやり２1":0,"口横広げ":0,"口横缩げ":0,"口角上げ":0,"口角下げ1":0,"口角下げ":0,"まばたき":0.37,"笑い":0.37,"ウィンク":0,"ウィンク右":0,"ウィンク２":0,"ｳｨﾝｸ２右":0,"びっくり":0,"恐ろしい子！":0,"なごみ":0,"はちゅ目":0,"はぅ":0,"ｷﾘｯ":0,"眼角下":0,"眼睑上":0,"じと目":0,"じと目1":0,"照れ":0},"rotatableBones":{"上半身":{"x":0.04,"y":0.2,"z":0.01,"w":0.98},"首":{"x":0,"y":0,"z":0,"w":1},"頭":{"x":-0.04,"y":-0.11,"z":0.04,"w":0.99}},"movableBones":{"センター":{"x":0,"y":7.95,"z":-0.45},"左足ＩＫ":{"x":-0.5,"y":0.8,"z":-1.2},"右足ＩＫ":{"x":0.35,"y":0.8,"z":0}}}

Description: Standing with both arms extended forward, palms open and fingers spread.
Output JSON: {"description":"Standing with both arms extended forward, palms open and fingers spread.","face":{"真面目":0,"困る":0,"にこり":0,"怒り":0,"あ":0,"い":0,"う":0,"え":0,"お":0.6,"お1":0,"にやり２":0,"にやり２1":0,"口横広げ":0,"口横缩げ":0,"口角上げ":0,"口角下げ1":0,"口角下げ":0,"まばたき":0,"笑い":0,"ウィンク":0,"ウィンク右":0,"ウィンク２":0,"ｳｨﾝｸ２右":0,"びっくり":0,"恐ろしい子！":0,"なごみ":0,"はちゅ目":0,"はぅ":0,"ｷﾘｯ":0,"眼角下":0,"眼睑上":0,"じと目":0,"じと目1":0,"照れ":0},"rotatableBones":{"上半身":{"x":-0.2,"y":-0.04,"z":-0.04,"w":0.98},"首":{"x":0,"y":0,"z":0,"w":1},"頭":{"x":0.16,"y":-0.01,"z":-0.09,"w":0.98}},"movableBones":{"センター":{"x":-3.35,"y":7.44,"z":0.4},"左足ＩＫ":{"x":-3.04,"y":1.17,"z":1.2},"右足ＩＫ":{"x":-5.05,"y":0.8,"z":-0.05}}}

Now, given a new description, output ONLY a valid JSON object in the same concise style.
`

const userPrompt = `
Pose description: {description}
`

export async function POST(request: Request) {
  if (!process.env.AI_MODEL || !process.env.AI_API_KEY || !process.env.AI_API_BASE_URL) {
    return Response.json({ error: "Missing required environment variables" }, { status: 500 })
  }

  try {
    const { description } = await request.json()

    const provider = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_API_BASE_URL,
    })

    const response = await provider.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt.replace("{description}", description) },
      ],
    })

    let result
    try {
      result = JSON.parse(response.choices[0].message.content ?? "{}")
    } catch {
      return Response.json(
        { error: "Invalid JSON generated by AI", raw: response.choices[0].message.content },
        { status: 500 }
      )
    }

    return Response.json({
      result,
    })
  } catch (error) {
    console.error("Error generating pose:", error)
    return Response.json({ error: "Failed to generate pose" }, { status: 500 })
  }
}
