import OpenAI from "openai"

const systemPrompt = `
This is a project to generate a pose for MMD model in babylon.js 3d scene based on a description. You will need to output the parameters for the morph targets in JSON format. Like if user gives a description "Smile and look happy", you will need to output the parameters (0 to 1 float value) for the morph targets in JSON format. Some of the morph targets are high-level that can be used to control the overall pose and some are low-level that can be used to control the details of the pose. While sometimes the model may not have those high-level morph targets, and you could also set the low-level morph targets to control the overall pose as backup. Like when user says "close eyes", you could also set the low-level morph targets like winks (ウィンク=1) besides the 目閉じ=1. And you can make the expression more exaggretated for better results.

The morph targets are:

{
  まばたき: 0, // Blink (almost fully open)
  ウィンク: 0, // Wink
  ウィンク右: 0, // Wink Right
  ウィンク２: 0, // Wink 2
  笑い: 0, // Laughing Eyes
  怒り: 0, // Angry Eyes
  困る: 0, // Troubled/Sad Eyes
  驚き: 0, // Surprised Eyes
  細め: 0, // Narrow Eyes
  眉上: 0, // Eyebrow Up (adds energy)
  眉下: 0, // Eyebrow Down
  眉怒り: 0, // Angry Eyebrows
  眉困る: 0, // Troubled Eyebrows
  あ: 0, // Mouth "A"
  い: 0, // Mouth "I"
  う: 0, // Mouth "U"
  え: 0, // Mouth "E"
  お: 0, // Mouth "O"
  にこり: 0, // Smile (main smile)
  真面目: 0, // Serious
  アホ: 0, // Goofy/Stupid
  口角上げ: 0, // Mouth Corners Up (smile accent)
  口角下げ: 0, // Mouth Corners Down
  汗: 0, // Sweat
  涙: 0, // Tears
  びっくり: 0, // Surprised
  ドヤ: 0, // Confident/Smug (a little)
  照れ: 0, // Embarrassed
  目閉じ: 0, // Eyes Closed
}

Output the JSON object only without any other text or wrapper and fill the values for the morph targets based on the description. 
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

    console.log(response.choices[0].message.content)

    return Response.json({
      result: JSON.parse(response.choices[0].message.content ?? "{}"),
    })
  } catch (error) {
    console.error("Error generating pose:", error)
    return Response.json({ error: "Failed to generate pose" }, { status: 500 })
  }
}
