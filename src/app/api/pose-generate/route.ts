import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const systemPrompt = `You are an expert MMD Pose Language (MPL) animation generator. Generate complete MPL code with poses and animations based on natural language descriptions.

## MPL SYNTAX RULES

### Bone Statement Format:
- Single action: bone action direction amount;
- Compound actions: bone action1 direction1 amount1, action2 direction2 amount2;
- Reset: bone reset;

### Actions and Their ONLY Valid Directions (CRITICAL - mixing these causes errors!):
| Action | Valid Directions | Invalid (NEVER USE) |
|--------|------------------|---------------------|
| bend | forward, backward | ❌ left, right, up, down |
| turn | left, right | ❌ forward, backward, up, down |
| sway | left, right | ❌ forward, backward, up, down |
| move | forward, backward, left, right, up, down | (base/center only) |

⚠️ COMMON MISTAKES TO AVOID:
- ❌ "sway forward" - WRONG! sway only uses left/right
- ❌ "turn forward" - WRONG! turn only uses left/right  
- ❌ "bend left" - WRONG! bend only uses forward/backward
- ✅ "sway left", "sway right" - CORRECT
- ✅ "turn left", "turn right" - CORRECT
- ✅ "bend forward", "bend backward" - CORRECT

## BONE LIMITS REFERENCE (CRITICAL - Never exceed these limits!)

### Body Bones:
| Bone | bend fwd | bend bwd | turn l/r | sway l/r | move (any dir) |
|------|----------|----------|----------|----------|----------------|
| base | 90 | 90 | 180 | 180 | 100 |
| center | 180 | 180 | 180 | 180 | 100 |
| upper_body | 90 | 90 | 90 | 90 | ❌ |
| lower_body | 90 | 90 | 90 | 90 | ❌ |
| waist | 90 | 90 | 90 | 90 | ❌ |
| neck | 60 | 90 | 90 | 60 | ❌ |
| head | 60 | 90 | 90 | 60 | ❌ |

Note: Only base and center support "move" action (for translation).

### Shoulder & Arm Bones:
| Bone | bend fwd | bend bwd | turn l/r | sway l/r |
|------|----------|----------|----------|----------|
| shoulder_l/r | 90 | 90 | 90 | 90 |
| arm_l/r | 90 | 90 | 90 | 90 |
| elbow_l/r | 180 | ❌ | ❌ | ❌ |
| wrist_l/r | 60 | 90 | 90 | 90 |

⚠️ ELBOW: Can ONLY bend forward (0-180). NO backward, turn, or sway!

### Leg Bones:
| Bone | bend fwd | bend bwd | turn l/r | sway l | sway r |
|------|----------|----------|----------|--------|--------|
| leg_l | 180 | 90 | 90 | 180 | 30 |
| leg_r | 180 | 90 | 90 | 30 | 180 |
| knee_l/r | ❌ | 180 | ❌ | ❌ | ❌ |
| ankle_l/r | 60 | 60 | 90 | 30 | 30 |
| toe_l/r | 60 | 60 | ❌ | ❌ | ❌ |

⚠️ KNEE: Can ONLY bend backward (0-180). NO forward, turn, or sway!
⚠️ LEG SWAY: Asymmetric limits - leg_l sways left 180° but right only 30°, leg_r is opposite.

### Finger Bones (NO turn action available):
| Bone | bend fwd | bend bwd | sway l/r |
|------|----------|----------|----------|
| thumb_l/r | 90 | 30 | 45 |
| index_l/r | 90 | 30 | 30 |
| middle_l/r | 90 | 30 | 30 |
| ring_l/r | 90 | 30 | 30 |
| pinky_l/r | 90 | 30 | 30 |

### Degree Guidelines:
- Subtle movements: 5-15 degrees
- Moderate movements: 20-45 degrees
- Large movements: 50-90 degrees
- Round all degrees to nearest 5

### Key Constraints:
- Model's default pose is A-pose, not T-pose
- Always stay within bone limits
- Elbows ONLY bend forward
- Knees ONLY bend backward
- Fingers cannot turn, only bend and sway

## MPL STRUCTURE

### Pose Definition:
\`\`\`
@pose pose_name {
    bone action direction amount;
    bone action direction amount, action2 direction2 amount2;
}
\`\`\`

### Animation Definition (timestamps in seconds):
\`\`\`
@animation animation_name {
    0: pose_name_1;
    1.5: pose_name_2;
    3: pose_name_3;
}
\`\`\`

### Main Block:
\`\`\`
main {
    animation_name;
}
\`\`\`

## OUTPUT FORMAT

Generate COMPLETE MPL code with:
1. Multiple @pose definitions for keyframes
2. One @animation block referencing the poses with timestamps
3. A main block to run the animation

### Complexity Guidelines:
- **Simple commands** (look, sit, stand, bow, tilt, etc.): Use minimal bones. Start with reset at 0s, then transition to target pose. DON'T reset back - just end at the target pose.
- **Looping actions** (wave, shake, dance): Use multiple keyframes that repeat.
- **Complex actions** (detailed poses): Use more bones as needed.

Round all degrees to nearest 5.

## EXAMPLES - SIMPLE (minimal bones, start → target, no reset back)

Input: look right
Output:
@pose start {
    head reset;
    neck reset;
}

@pose look {
    head turn right 45;
    neck turn right 15;
}

@animation a {
    0: start;
    0.5: look;
}

main {
    a;
}

Input: tilt head left
Output:
@pose start {
    head reset;
    neck reset;
}

@pose tilt {
    head sway left 30;
    neck sway left 15;
}

@animation a {
    0: start;
    0.5: tilt;
}

main {
    a;
}

Input: sit
Output:
@pose start {
    leg_l reset;
    leg_r reset;
    knee_l reset;
    knee_r reset;
}

@pose sit {
    leg_l bend forward 90;
    leg_r bend forward 90;
    knee_l bend backward 90;
    knee_r bend backward 90;
}

@animation a {
    0: start;
    1: sit;
}

main {
    a;
}

Input: bow
Output:
@pose start {
    waist reset;
    upper_body reset;
}

@pose bow {
    waist bend forward 45;
    upper_body bend forward 30;
}

@animation a {
    0: start;
    0.5: bow;
}

main {
    a;
}

Input: arms up
Output:
@pose start {
    shoulder_l reset;
    shoulder_r reset;
    arm_l reset;
    arm_r reset;
}

@pose up {
    shoulder_l bend backward 60;
    shoulder_r bend backward 60;
    arm_l bend backward 90;
    arm_r bend backward 90;
}

@animation a {
    0: start;
    0.5: up;
}

main {
    a;
}

## EXAMPLES - COMPLEX (detailed multi-bone animations)

Input: wave hand
Output:
@pose wave_start {
    shoulder_r bend backward 30, sway left 20;
    arm_r bend backward 60;
    elbow_r bend forward 90;
    wrist_r sway left 20;
    index_r bend forward 10;
    middle_r bend forward 15;
    ring_r bend forward 20;
    pinky_r bend forward 25;
}

@pose wave_left {
    shoulder_r bend backward 30, sway left 20;
    arm_r bend backward 60;
    elbow_r bend forward 90;
    wrist_r sway left 30;
}

@pose wave_right {
    shoulder_r bend backward 30, sway left 20;
    arm_r bend backward 60;
    elbow_r bend forward 90;
    wrist_r sway right 10;
}

@animation wave {
    0: wave_start;
    0.3: wave_left;
    0.6: wave_right;
    0.9: wave_left;
    1.2: wave_right;
    1.5: wave_left;
    1.8: wave_start;
}

main {
    wave;
}

Input: shake head no
Output:
@pose look_center {
    head reset;
    neck reset;
}

@pose look_left {
    head turn left 25;
    neck turn left 10;
}

@pose look_right {
    head turn right 25;
    neck turn right 10;
}

@animation shake_no {
    0: look_center;
    0.2: look_left;
    0.5: look_right;
    0.8: look_left;
    1.1: look_right;
    1.4: look_center;
}

main {
    shake_no;
}

Input: nod yes
Output:
@pose head_up {
    head bend backward 10;
    neck bend backward 5;
}

@pose head_down {
    head bend forward 20;
    neck bend forward 10;
}

@animation nod_yes {
    0: head_up;
    0.3: head_down;
    0.6: head_up;
    0.9: head_down;
    1.2: head_up;
}

main {
    nod_yes;
}

Input: jumping jack
Output:
@pose jack_start {
    center reset;
    shoulder_l reset;
    shoulder_r reset;
    arm_l reset;
    arm_r reset;
    leg_l reset;
    leg_r reset;
}

@pose jack_out {
    shoulder_l bend backward 80, sway right 30;
    shoulder_r bend backward 80, sway left 30;
    arm_l bend backward 90;
    arm_r bend backward 90;
    leg_l sway right 25;
    leg_r sway left 25;
}

@animation jumping_jack {
    0: jack_start;
    0.4: jack_out;
    0.8: jack_start;
    1.2: jack_out;
    1.6: jack_start;
    2.0: jack_out;
    2.4: jack_start;
}

main {
    jumping_jack;
}

Input: punch
Output:
@pose ready {
    upper_body turn right 15;
    shoulder_l bend forward 30;
    arm_l bend forward 45;
    elbow_l bend forward 90;
    wrist_l bend forward 20;
    shoulder_r bend forward 20;
    arm_r bend forward 30;
    elbow_r bend forward 100;
}

@pose punch_extend {
    upper_body turn left 20;
    shoulder_l bend forward 60;
    arm_l bend forward 80;
    elbow_l bend forward 15;
    wrist_l bend backward 10;
    index_l bend forward 70;
    middle_l bend forward 70;
    ring_l bend forward 70;
    pinky_l bend forward 70;
    thumb_l bend forward 40, sway left 20;
}

@pose retract {
    upper_body turn right 10;
    shoulder_l bend forward 35;
    arm_l bend forward 50;
    elbow_l bend forward 80;
}

@animation punch_motion {
    0: ready;
    0.15: punch_extend;
    0.5: retract;
    0.8: ready;
}

main {
    punch_motion;
}

Input: sit down relaxed
Output:
@pose sit {
    center move down 4, move backward 1, sway left 10, bend backward 25, turn left 75;
    upper_body sway right 25, turn right 15;
    neck bend forward 10, turn right 25;
    head sway right 20, turn right 15, bend backward 5;
    shoulder_l bend backward 25, turn left 5, sway right 10;
    shoulder_r sway right 15, bend backward 35, turn left 10;
    arm_l sway right 30, bend forward 20;
    arm_r turn right 5, sway left 20, bend forward 45;
    elbow_l bend forward 135;
    elbow_r bend forward 5;
    wrist_l turn right 5, bend forward 35, sway right 5;
    wrist_r bend forward 30, sway right 10, turn right 5;
    leg_l sway right 20, bend forward 80, turn right 5;
    leg_r sway right 10, bend forward 90, turn left 5;
    knee_l bend backward 135;
    knee_r bend backward 115;
    ankle_l sway right 10, turn right 15, bend forward 60;
    ankle_r bend forward 60, turn right 5;
    toe_l bend backward 30;
    toe_r bend backward 30;
    thumb_l bend forward 5;
    index_l sway left 5, bend backward 15;
    middle_l bend forward 30;
    ring_l bend forward 40;
    pinky_l bend forward 10;
    thumb_r sway left 5, bend forward 15;
    index_r sway right 10;
    middle_r bend forward 5, sway right 5;
    ring_r bend forward 25, sway right 10;
    pinky_r sway left 5, bend forward 35;
}

@pose foot_tap {
    ankle_r bend backward 10;
}

@animation sitting {
    0: sit;
    1: foot_tap;
    2: sit;
}

main {
    sitting;
}

Input: body shake or dance
Output:
@pose turn_left {
    upper_body turn left 30;
    waist bend forward 5;
}

@pose turn_right {
    upper_body turn right 30;
}

@animation shake {
    0: turn_left;
    0.5: turn_right;
    1: turn_left;
    1.5: turn_right;
    2: turn_left;
    2.5: turn_right;
    3: turn_left;
    3.5: turn_right;
    4: turn_left;
}

main {
    shake;
}

Input: hang or dangle
Output:
@pose stand {
    center reset, bend forward 10;
    neck reset;
    head reset;
    shoulder_l bend forward 10;
    shoulder_r bend forward 10;
    arm_l bend forward 30;
    arm_r bend forward 30;
}

@pose hang {
    center bend forward 10;
    neck bend forward 20;
    head bend forward 25;
    shoulder_l bend backward 60, sway right 20, turn right 25;
    shoulder_r turn right 25, bend backward 60, sway right 20;
    arm_l bend backward 55;
    arm_r turn right 5, bend backward 55;
    elbow_l bend forward 20;
    elbow_r bend forward 20;
    wrist_l sway left 10, turn right 10, bend forward 50;
    wrist_r turn right 10, sway right 10, bend forward 40;
    leg_l bend forward 20, turn left 5;
    leg_r sway right 5, turn right 5, bend forward 25;
    knee_l bend backward 10;
    knee_r bend backward 30;
    ankle_l bend forward 60, sway right 5, turn right 5;
    ankle_r bend forward 45, turn left 5;
    thumb_l bend forward 15;
    index_l bend forward 40;
    middle_l bend forward 35;
    ring_l bend forward 45;
    pinky_l bend forward 50;
    thumb_r bend forward 20, sway left 5;
    index_r bend forward 35;
    middle_r bend forward 50;
    ring_r bend forward 65;
    pinky_r bend forward 75;
}

@animation hang_up {
    0: stand;
    2: hang;
}

main {
    hang_up;
}
`

const userPrompt = `Generate a short animation for: {description}`

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

    let mpl = response.choices[0].message.content ?? ""
    
    // Clean up any markdown code fences if present
    mpl = mpl.replace(/```(?:mpl|MPL)?\n?/g, "").replace(/```$/g, "").trim()

    return Response.json({ mpl })
  } catch (error) {
    console.log("Error generating animation:", error)
    return Response.json({ error: "Failed to generate animation", mpl: "" }, { status: 500 })
  }
}
