export type BoneRotationQuaternion = [number, number, number, number] // [x, y, z, w]

// keys are in Japanese
export interface Pose {
  description: string
  morphs: {
    [key: string]: number
  }
  bones: {
    [key: string]: BoneRotationQuaternion
  }
}

export const Morphs: string[] = [
  "真面目",
  "困る",
  "にこり",
  "怒り",
  "まばたき",
  "笑い",
  "ウィンク",
  "ウィンク右",
  "ウィンク２",
  "ｳｨﾝｸ２右",
  "なごみ",
  "びっくり",
  "恐ろしい子！",
  "はちゅ目",
  "はぅ",
  "ｷﾘｯ",
  "眼睑上",
  "眼角下",
  "じと目",
  "じと目1",
  "あ",
  "い",
  "う",
  "え",
  "お",
  "お1",
  "口角上げ",
  "口角下げ",
  "口角下げ1",
  "口横缩げ",
  "口横広げ",
  "にやり２",
  "にやり２1",
  "照れ",
]
// Mapping of bone English names to Japanese names used in MMD
export const BONES: Record<string, string> = {
  base: "全ての親",
  center: "センター",
  upper_body: "上半身",
  upper_body2: "上半身2",
  waist: "腰",
  neck: "首",
  head: "頭",
  shoulder_l: "左肩",
  shoulder_r: "右肩",
  arm_l: "左腕",
  arm_r: "右腕",
  arm_twist_l: "左腕捩",
  arm_twist_r: "右腕捩",
  elbow_l: "左ひじ",
  elbow_r: "右ひじ",
  wrist_l: "左手首",
  wrist_r: "右手首",
  wrist_twist_l: "左手捩",
  wrist_twist_r: "右手捩",
  leg_l: "左足",
  leg_r: "右足",
  knee_l: "左ひざ",
  knee_r: "右ひざ",
  ankle_l: "左足首",
  ankle_r: "右足首",
  forefoot_l: "左足先EX",
  forefoot_r: "右足先EX",
  thumb_0_l: "左親指０",
  thumb_0_r: "右親指０",
  thumb_1_l: "左親指１",
  thumb_1_r: "右親指１",
  thumb_2_l: "左親指２",
  thumb_2_r: "右親指２",
  index_0_l: "左人指１",
  index_0_r: "右人指１",
  index_1_l: "左人指２",
  index_1_r: "右人指２",
  index_2_l: "左人指３",
  index_2_r: "右人指３",
  middle_0_l: "左中指１",
  middle_0_r: "右中指１",
  middle_l_1: "左中指２",
  middle_1_r: "右中指２",
  middle_2_l: "左中指３",
  middle_2_r: "右中指３",
  ring_0_l: "左薬指１",
  ring_0_r: "右薬指１",
  ring_1_l: "左薬指２",
  ring_1_r: "右薬指２",
  ring_2_l: "左薬指３",
  ring_2_r: "右薬指３",
  pinky_0_l: "左小指１",
  pinky_0_r: "右小指１",
  pinky_1_l: "左小指２",
  pinky_1_r: "右小指２",
  pinky_2_l: "左小指３",
  pinky_2_r: "右小指３",
}

// Valid action types
export const ACTIONS: string[] = ["bend", "turn", "sway"]

// Valid direction types
export const DIRECTIONS: string[] = ["forward", "backward", "left", "right"]

// Rule defining rotation axis and degree limit for each action
interface ActionRule {
  axis: [number, number, number] // 3D vector representing rotation axis
  limit: number // Maximum degrees allowed for this action
}

// Comprehensive bone action rules defining how each bone can move
// Each bone has actions (bend/turn/sway) with directions and their axis vectors
export const BONE_ACTION_RULES: Record<string, Record<string, Record<string, ActionRule>>> = {
  base: {
    bend: { forward: { axis: [-1, 0, 0], limit: 90 }, backward: { axis: [1, 0, 0], limit: 90 } },
    turn: { left: { axis: [0, -1, 0], limit: 180 }, right: { axis: [0, 1, 0], limit: 180 } },
    sway: { left: { axis: [0, 0, -1], limit: 180 }, right: { axis: [0, 0, 1], limit: 180 } },
  },
  center: {
    bend: { forward: { axis: [-1, 0, 0], limit: 180 }, backward: { axis: [1, 0, 0], limit: 180 } },
    turn: { left: { axis: [0, -1, 0], limit: 180 }, right: { axis: [0, 1, 0], limit: 180 } },
    sway: { left: { axis: [0, 0, -1], limit: 180 }, right: { axis: [0, 0, 1], limit: 180 } },
  },
  head: {
    bend: { forward: { axis: [-1, 0, 0], limit: 60 }, backward: { axis: [1, 0, 0], limit: 90 } },
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
    sway: { left: { axis: [0, 0, -1], limit: 30 }, right: { axis: [0, 0, 1], limit: 30 } },
  },
  neck: {
    bend: { forward: { axis: [-1, 0, 0], limit: 45 }, backward: { axis: [1, 0, 0], limit: 60 } },
    turn: { left: { axis: [0, -1, 0], limit: 75 }, right: { axis: [0, 1, 0], limit: 75 } },
    sway: { left: { axis: [0, 0, -1], limit: 30 }, right: { axis: [0, 0, 1], limit: 30 } },
  },
  upper_body: {
    bend: { forward: { axis: [-1, 0, 0], limit: 45 }, backward: { axis: [1, 0, 0], limit: 45 } },
    turn: { left: { axis: [0, -1, 0], limit: 45 }, right: { axis: [0, 1, 0], limit: 45 } },
    sway: { left: { axis: [0, 0, -1], limit: 45 }, right: { axis: [0, 0, 1], limit: 45 } },
  },
  upper_body2: {
    bend: { forward: { axis: [-1, 0, 0], limit: 45 }, backward: { axis: [1, 0, 0], limit: 45 } },
    turn: { left: { axis: [0, -1, 0], limit: 45 }, right: { axis: [0, 1, 0], limit: 45 } },
    sway: { left: { axis: [0, 0, -1], limit: 45 }, right: { axis: [0, 0, 1], limit: 45 } },
  },
  waist: {
    bend: { forward: { axis: [-1, 0, 0], limit: 90 }, backward: { axis: [1, 0, 0], limit: 90 } },
    turn: { left: { axis: [0, -1, 0], limit: 45 }, right: { axis: [0, 1, 0], limit: 45 } },
    sway: { left: { axis: [0, 0, -1], limit: 30 }, right: { axis: [0, 0, 1], limit: 30 } },
  },

  shoulder_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 90 } },
    sway: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  shoulder_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 90 } },
    sway: { left: { axis: [0, 1, 0], limit: 90 }, right: { axis: [0, -1, 0], limit: 90 } },
  },
  arm_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 90 } },
    sway: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  arm_r: {
    bend: { forward: { axis: [1, 0, 0], limit: 45 }, backward: { axis: [-1, 0, 0], limit: 180 } },
    sway: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  arm_twist_l: {
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  arm_twist_r: {
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  elbow_l: {
    bend: {
      forward: { axis: [1, 1, 0], limit: 135 },
    },
  },
  elbow_r: {
    bend: {
      forward: { axis: [1, -1, 0], limit: 135 },
    },
  },
  wrist_l: {
    bend: {
      forward: { axis: [0, 0, -1], limit: 60 },
      backward: { axis: [1, 0, -1], limit: 30 },
    },
    sway: {
      right: { axis: [1, 1, 0], limit: 15 },
      left: { axis: [-1, 1, 0], limit: 15 },
    },
  },
  wrist_r: {
    bend: {
      forward: { axis: [0, 0, 1], limit: 60 },
      backward: { axis: [-1, 0, -1], limit: 30 },
    },
    sway: {
      right: { axis: [-1, -1, 0], limit: 15 },
      left: { axis: [1, -1, 0], limit: 15 },
    },
  },
  wrist_twist_l: {
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },
  wrist_twist_r: {
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
  },

  leg_l: {
    bend: { forward: { axis: [1, 0, 0], limit: 90 }, backward: { axis: [-1, 0, 0], limit: 90 } },
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
    sway: { left: { axis: [0, 0, 1], limit: 180 }, right: { axis: [0, 0, -1], limit: 30 } },
  },
  leg_r: {
    bend: { forward: { axis: [1, 0, 0], limit: 90 }, backward: { axis: [-1, 0, 0], limit: 90 } },
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
    sway: { left: { axis: [0, 0, 1], limit: 30 }, right: { axis: [0, 0, -1], limit: 180 } },
  },
  knee_l: { bend: { backward: { axis: [-1, 0, 0], limit: 135 } } },
  knee_r: { bend: { backward: { axis: [-1, 0, 0], limit: 135 } } },
  ankle_l: {
    bend: { forward: { axis: [-1, 0, 0], limit: 60 }, backward: { axis: [1, 0, 0], limit: 60 } },
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
    sway: { left: { axis: [0, 0, 1], limit: 30 }, right: { axis: [0, 0, -1], limit: 30 } },
  },
  ankle_r: {
    bend: { forward: { axis: [-1, 0, 0], limit: 60 }, backward: { axis: [1, 0, 0], limit: 60 } },
    turn: { left: { axis: [0, -1, 0], limit: 90 }, right: { axis: [0, 1, 0], limit: 90 } },
    sway: { left: { axis: [0, 0, 1], limit: 30 }, right: { axis: [0, 0, -1], limit: 30 } },
  },
  forefoot_l: { bend: { forward: { axis: [-1, 0, 0], limit: 30 }, backward: { axis: [1, 0, 0], limit: 30 } } },
  forefoot_r: { bend: { forward: { axis: [-1, 0, 0], limit: 30 }, backward: { axis: [1, 0, 0], limit: 30 } } },

  thumb_0_l: {
    bend: { forward: { axis: [-1, 1, 0], limit: 90 }, backward: { axis: [1, 1, 0], limit: 15 } },
    sway: { left: { axis: [0, 0, 1], limit: 45 }, right: { axis: [0, 0, -1], limit: 45 } },
  },
  thumb_1_l: {
    bend: { forward: { axis: [-1, 1, 0], limit: 90 }, backward: { axis: [1, 1, 0], limit: 15 } },
  },
  thumb_2_l: {
    bend: { forward: { axis: [-1, 1, 0], limit: 90 }, backward: { axis: [1, 1, 0], limit: 15 } },
  },
  index_0_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
    sway: { left: { axis: [-1, 0, 0], limit: 15 }, right: { axis: [1, 0, 0], limit: 15 } },
  },
  index_1_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  index_2_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  middle_0_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
    sway: { left: { axis: [-1, 0, 0], limit: 45 }, right: { axis: [1, 0, 0], limit: 45 } },
  },
  middle_1_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  middle_2_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  ring_0_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
    sway: { left: { axis: [-1, 0, 0], limit: 45 }, right: { axis: [1, 0, 0], limit: 45 } },
  },
  ring_1_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  ring_2_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  pinky_0_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
    sway: { left: { axis: [-1, 0, 0], limit: 45 }, right: { axis: [1, 0, 0], limit: 45 } },
  },
  pinky_1_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },
  pinky_2_l: {
    bend: { forward: { axis: [0, 0, -1], limit: 90 }, backward: { axis: [0, 0, 1], limit: 15 } },
  },

  thumb_0_r: {
    bend: { forward: { axis: [-1, -1, 0], limit: 90 }, backward: { axis: [1, -1, 0], limit: 15 } },
    sway: { left: { axis: [0, 0, 1], limit: 45 }, right: { axis: [0, 0, -1], limit: 45 } },
  },
  thumb_1_r: {
    bend: { forward: { axis: [-1, -1, 0], limit: 90 }, backward: { axis: [1, -1, 0], limit: 15 } },
  },
  thumb_2_r: {
    bend: { forward: { axis: [-1, -1, 0], limit: 90 }, backward: { axis: [1, -1, 0], limit: 15 } },
  },
  index_0_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
    sway: { left: { axis: [1, 0, 0], limit: 15 }, right: { axis: [-1, 0, 0], limit: 15 } },
  },
  index_1_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  index_2_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  middle_0_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
    sway: { left: { axis: [1, 0, 0], limit: 45 }, right: { axis: [-1, 0, 0], limit: 45 } },
  },
  middle_1_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  middle_2_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  ring_0_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
    sway: { left: { axis: [1, 0, 0], limit: 45 }, right: { axis: [-1, 0, 0], limit: 45 } },
  },
  ring_1_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  ring_2_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  pinky_0_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
    sway: { left: { axis: [1, 0, 0], limit: 45 }, right: { axis: [-1, 0, 0], limit: 45 } },
  },
  pinky_1_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
  pinky_2_r: {
    bend: { forward: { axis: [0, 0, 1], limit: 90 }, backward: { axis: [0, 0, -1], limit: 15 } },
  },
}

// Generate all valid bone-action-direction combinations
export const VALID_STATEMENTS = ((): string[] => {
  const combinations: string[] = []
  for (const [bone, actions] of Object.entries(BONE_ACTION_RULES)) {
    for (const [action, directions] of Object.entries(actions)) {
      for (const direction of Object.keys(directions)) {
        combinations.push(`${bone} ${action} ${direction}`)
      }
    }
  }
  return combinations
})()

// Structure representing a single MPL statement
export interface MPLStatement {
  bone: string
  action: string
  direction: string
  degrees: number
}

// Validate and parse a single MPL statement string
export const validateStatement = (input: string): MPLStatement | null => {
  if (input === "") return null

  const segments = input.split(" ")
  if (segments.length !== 4) return null

  const bone = segments[0].toLowerCase() as string
  const action = segments[1].toLowerCase() as string
  const direction = segments[2].toLowerCase() as string
  const degrees = Number(segments[3])

  // Validate each component
  const boneRules = BONE_ACTION_RULES[bone]
  const actionRules = boneRules?.[action]
  const rule = actionRules?.[direction]

  if (!BONES[bone] || !ACTIONS.includes(action) || !DIRECTIONS.includes(direction) || isNaN(degrees) || !rule) {
    return null
  }
  if (degrees > rule.limit) {
    console.log(`${bone} ${action} ${direction} ${degrees} is greater than ${rule.limit}`)
    return null
  }

  return { bone, action, direction, degrees } as MPLStatement
}

// Multiply two quaternions (for combining rotations)
const multiplyQuaternions = (
  q1: [number, number, number, number],
  q2: [number, number, number, number]
): [number, number, number, number] => {
  const [x1, y1, z1, w1] = q1
  const [x2, y2, z2, w2] = q2

  return [
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
  ]
}

// Convert a single MPL statement to a quaternion
const mplToQuat = (statement: MPLStatement): [number, number, number, number] | null => {
  const { bone, action, direction, degrees } = statement

  const boneRules = BONE_ACTION_RULES[bone]
  const actionRules = boneRules?.[action]
  const rule = actionRules?.[direction]

  if (!rule) return null

  // Get normalized rotation axis
  const [x, y, z] = rule.axis
  const magnitude = Math.sqrt(x * x + y * y + z * z)
  if (magnitude === 0) return null

  const normalizedX = x / magnitude
  const normalizedY = y / magnitude
  const normalizedZ = z / magnitude

  // Create quaternion from axis-angle
  const radians = degrees * (Math.PI / 180)
  const halfAngle = radians / 2
  const sin = Math.sin(halfAngle)
  const cos = Math.cos(halfAngle)

  return [normalizedX * sin, normalizedY * sin, normalizedZ * sin, cos]
}

// Calculate distance between two quaternions (0 = identical, 1 = opposite)
const quaternionDistance = (q1: [number, number, number, number], q2: [number, number, number, number]): number => {
  // Handle quaternion double-cover (q and -q represent same rotation)
  const dot1 = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3]
  const dot2 = q1[0] * -q2[0] + q1[1] * -q2[1] + q1[2] * -q2[2] + q1[3] * -q2[3]
  return 1 - Math.abs(Math.max(dot1, dot2))
}

// Convert a quaternion back to MPL statements using global optimization
const quaternionToMPL = (
  bone: string,
  targetQuaternion: [number, number, number, number],
  tolerance: number = 0.0001
): string[] => {
  if (!BONES[bone]) return []

  const boneRules = BONE_ACTION_RULES[bone]
  if (!boneRules) return []

  // Get all possible actions for this bone
  const possibleActions: Array<{ action: string; direction: string; rule: ActionRule }> = []
  for (const [action, directions] of Object.entries(boneRules)) {
    for (const [direction, rule] of Object.entries(directions)) {
      possibleActions.push({ action, direction, rule })
    }
  }

  // Evaluate fitness of a degree combination
  const evaluateCombination = (degrees: number[]): number => {
    if (degrees.length !== possibleActions.length) return Infinity

    let combinedQuaternion: [number, number, number, number] = [0, 0, 0, 1]

    for (let i = 0; i < degrees.length; i++) {
      const deg = Math.max(0, Math.min(possibleActions[i].rule.limit, degrees[i]))
      if (deg > 0.01) {
        // Only apply significant rotations
        const q = mplToQuat({
          bone,
          action: possibleActions[i].action,
          direction: possibleActions[i].direction,
          degrees: deg,
        })
        if (q) {
          combinedQuaternion = multiplyQuaternions(combinedQuaternion, q)
        }
      }
    }

    return quaternionDistance(targetQuaternion, combinedQuaternion)
  }

  // Nelder-Mead simplex optimization algorithm
  const nelderMead = (initialGuess: number[], maxIterations: number = 200): { degrees: number[]; distance: number } => {
    const n = initialGuess.length
    const alpha = 1.0 // reflection coefficient
    const gamma = 2.0 // expansion coefficient
    const rho = 0.5 // contraction coefficient
    const sigma = 0.5 // shrinkage coefficient

    // Initialize simplex with n+1 points
    const simplex: Array<{ point: number[]; value: number }> = []

    simplex.push({
      point: [...initialGuess],
      value: evaluateCombination(initialGuess),
    })

    // Create additional points by perturbing initial guess
    for (let i = 0; i < n; i++) {
      const point = [...initialGuess]
      const range = possibleActions[i].rule.limit
      point[i] += range * 0.1
      simplex.push({
        point,
        value: evaluateCombination(point),
      })
    }

    // Main optimization loop
    for (let iter = 0; iter < maxIterations; iter++) {
      simplex.sort((a, b) => a.value - b.value)

      const best = simplex[0]
      const worst = simplex[n]
      const secondWorst = simplex[n - 1]

      // Check convergence
      if (worst.value - best.value < tolerance) break

      // Calculate centroid (excluding worst point)
      const centroid = new Array(n).fill(0)
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          centroid[j] += simplex[i].point[j]
        }
      }
      for (let j = 0; j < n; j++) {
        centroid[j] /= n
      }

      // Reflection step
      const reflected = centroid.map((c, i) => c + alpha * (c - worst.point[i]))
      const reflectedValue = evaluateCombination(reflected)

      if (reflectedValue >= best.value && reflectedValue < secondWorst.value) {
        worst.point = reflected
        worst.value = reflectedValue
        continue
      }

      // Expansion step
      if (reflectedValue < best.value) {
        const expanded = centroid.map((c, i) => c + gamma * (reflected[i] - c))
        const expandedValue = evaluateCombination(expanded)

        if (expandedValue < reflectedValue) {
          worst.point = expanded
          worst.value = expandedValue
        } else {
          worst.point = reflected
          worst.value = reflectedValue
        }
        continue
      }

      // Contraction step
      const contracted = centroid.map((c, i) => c + rho * (worst.point[i] - c))
      const contractedValue = evaluateCombination(contracted)

      if (contractedValue < worst.value) {
        worst.point = contracted
        worst.value = contractedValue
        continue
      }

      // Shrinkage step
      for (let i = 1; i <= n; i++) {
        for (let j = 0; j < n; j++) {
          simplex[i].point[j] = best.point[j] + sigma * (simplex[i].point[j] - best.point[j])
        }
        simplex[i].value = evaluateCombination(simplex[i].point)
      }
    }

    simplex.sort((a, b) => a.value - b.value)
    return {
      degrees: simplex[0].point,
      distance: simplex[0].value,
    }
  }

  let bestResult = { degrees: [] as number[], distance: Infinity }

  // Try optimization from multiple starting points for global search
  const startingPoints = [
    new Array(possibleActions.length).fill(0), // Zero start
    possibleActions.map((action) => Math.random() * Math.min(30, action.rule.limit)), // Random start
    possibleActions.map((action) => action.rule.limit * 0.5), // Mid-range start
    possibleActions.map((action, i) => (i % 2 === 0 ? action.rule.limit * 0.3 : action.rule.limit * 0.7)), // Mixed start
  ]

  for (const start of startingPoints) {
    const result = nelderMead(start)
    if (result.distance < bestResult.distance) {
      bestResult = result
    }
  }

  // Convert optimal degrees to MPL statements and simplify opposing actions
  const actionMap: Record<string, Record<string, number>> = {}

  // Group degrees by action and direction
  for (let i = 0; i < bestResult.degrees.length; i++) {
    const deg = bestResult.degrees[i]
    if (deg > 0.01) {
      const action = possibleActions[i]
      const clampedDeg = Math.max(0, Math.min(action.rule.limit, deg))

      if (!actionMap[action.action]) {
        actionMap[action.action] = {}
      }
      actionMap[action.action][action.direction] = clampedDeg
    }
  }

  // Simplify opposing directions within each action
  const statements: string[] = []
  for (const [action, directions] of Object.entries(actionMap)) {
    // Handle opposing pairs
    const opposingPairs = [
      ["forward", "backward"],
      ["left", "right"],
    ]

    const processedDirections = new Set<string>()

    for (const [dir1, dir2] of opposingPairs) {
      if (directions[dir1] && directions[dir2] && !processedDirections.has(dir1) && !processedDirections.has(dir2)) {
        const deg1 = directions[dir1]
        const deg2 = directions[dir2]
        const netDegrees = Math.abs(deg1 - deg2)

        if (netDegrees > 0.01) {
          const netDirection = deg1 > deg2 ? dir1 : dir2
          statements.push(`${bone} ${action} ${netDirection} ${netDegrees.toFixed(3)}`)
        }

        processedDirections.add(dir1)
        processedDirections.add(dir2)
      }
    }

    // Handle remaining directions that don't have opposing pairs
    for (const [direction, degrees] of Object.entries(directions)) {
      if (!processedDirections.has(direction) && degrees > 0.01) {
        statements.push(`${bone} ${action} ${direction} ${degrees.toFixed(3)}`)
      }
    }
  }

  return statements
}

// Convert entire pose to MPL string
export const PoseToMPL = (pose: Pose, tolerance: number = 0.001): string => {
  const allStatements: string[] = []

  for (const [boneNameJp, quaternion] of Object.entries(pose.bones)) {
    const boneNameEng = Object.keys(BONES).find((key) => BONES[key] === boneNameJp)

    if (boneNameEng && quaternion) {
      const statements = quaternionToMPL(boneNameEng, quaternion, tolerance)
      allStatements.push(...statements)
    }
  }

  return allStatements.join(";")
}

// Convert MPL string to pose object
export const MPLToPose = (input: string): Pose | null => {
  const statements = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s !== "")

  if (statements.length === 0) return null

  // Validate all statements
  const validStatements: MPLStatement[] = []
  for (const statement of statements) {
    const validStatement = validateStatement(statement)
    if (!validStatement) continue
    validStatements.push(validStatement)
  }

  const pose: Pose = {
    description: input,
    morphs: {},
    bones: {} as { [key: string]: BoneRotationQuaternion },
  }

  // Group statements by bone
  const boneGroups: Record<string, MPLStatement[]> = {}
  for (const statement of validStatements) {
    if (!boneGroups[statement.bone]) {
      boneGroups[statement.bone] = []
    }
    boneGroups[statement.bone].push(statement)
  }

  // Process each bone group
  for (const [bone, boneStatements] of Object.entries(boneGroups)) {
    let combinedQuaternion: [number, number, number, number] = [0, 0, 0, 1]

    for (const statement of boneStatements) {
      const quaternion = mplToQuat(statement)
      if (quaternion) {
        combinedQuaternion = multiplyQuaternions(combinedQuaternion, quaternion)
      }
    }

    pose.bones[BONES[bone]] = combinedQuaternion
  }
  return pose
}
