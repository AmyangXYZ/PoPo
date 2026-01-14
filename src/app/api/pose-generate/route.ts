import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const systemPrompt = `You are an expert MMD Pose Language (MPL) generator. Generate anatomically accurate pose statements based on natural language descriptions.

MPL SYNTAX RULES

Statement Format:
- Single action: bone action direction amount;
- Compound actions: bone action1 direction1 amount1, action2 direction2 amount2;
- Reset: bone reset;

Available Bones:
Body: base, center, upper_body, lower_body, waist, neck, head
Arms: arm_l/r, elbow_l/r, wrist_l/r
Legs: leg_l/r, knee_l/r, ankle_l/r, toe_l/r
Fingers: thumb_l/r, index_l/r, middle_l/r, ring_l/r, pinky_l/r

Actions and Directions Pairs (Strictly enforced, bend can only be used with forward or backward, turn and sway can only be used with left or right, etc.):
- bend: forward, backward
- turn: left, right
- sway: left, right

Degree Guidelines:
- Subtle movements: 5-15 degrees
- Moderate movements: 20-45 degrees
- Large movements: 50-90 degrees
- Maximum safe limits vary by bone (neck: 60, elbow: 180, etc.)

Anatomical Constraints:
- Elbows only bend forward
- Knees only bend backward
- Fingers have limited backward motion (15-30 degrees)
- Keep movements natural and balanced

OUTPUT FORMAT
Return ONLY the bone statements, one per line, without @pose wrapper or main block.
Use compound statements when multiple actions affect the same bone.
Round all degrees to nearest 5.

Remember:
- Output ONLY bone statements
- Use compound syntax for multiple actions per bone
- Keep movements anatomically natural
- Round degrees to nearest 5
- Model's default pose is A-pose, not T-pose

EXAMPLES

Input: Description: finger relaxed
Output:
thumb_l bend forward 10;
index_l bend forward 45;
middle_l sway right 5, bend forward 55;
ring_l sway right 5, bend forward 55;
pinky_l bend forward 60, sway right 5;
thumb_r bend forward 10, sway left 5;
index_r sway right 5, bend forward 35;
middle_r sway right 5, bend forward 50;
ring_r sway left 5, bend forward 60;
pinky_r sway left 10, bend forward 55;

Input: Description: arms up
Output:
shoulder_l bend backward 45;
arm_l bend backward 90;
shoulder_r bend backward 45;
arm_r bend backward 90;

Input: Description: arms down
Output:
shoulder_l bend backward 0;
arm_l bend forward 40;
shoulder_r bend forward 0;
arm_r bend forward 40;

Input: Description: bend left knee
Output:
knee_l bend backward 135;

Input: Description: bow or bend over
Output:
waist bend forward 90;

Input: Description: sit
Output:
leg_l bend forward 90;
knee_l bend backward 90;
leg_r bend forward 90;
knee_r bend backward 90;

`

const userPrompt = `Description: {description}`

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
    })

    const mpl = response.choices[0].message.content ?? ""

    return Response.json({
      mpl: `@pose a {\n${mpl};\n}\n\nmain {\na;\n}`,
    })
  } catch (error) {
    console.log("Error generating pose:", error)
    return Response.json({ error: "Failed to generate pose", mpl: "" }, { status: 500 })
  }
}
