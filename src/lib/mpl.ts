import { Morphs, MovableBones, Pose, RotatableBones } from "./pose"

export const BONES: Record<string, string> = {
  base: "全ての親",
  center: "センター",
  upper_body: "上半身",
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
  thumb_l_0: "左親指０",
  thumb_r_0: "右親指０",
  thumb_l_1: "左親指１",
  thumb_r_1: "右親指１",
  thumb_l_2: "左親指２",
  thumb_r_2: "右親指２",
  index_l_0: "左人指１",
  index_r_0: "右人指１",
  index_l_1: "左人指２",
  index_r_1: "右人指２",
  index_l_2: "左人指３",
  index_r_2: "右人指３",
  middle_l_0: "左中指１",
  middle_r_0: "右中指１",
  middle_l_1: "左中指２",
  middle_r_1: "右中指２",
  middle_l_2: "左中指３",
  middle_r_2: "右中指３",
  ring_l_0: "左薬指１",
  ring_r_0: "右薬指１",
  ring_l_1: "左薬指２",
  ring_r_1: "右薬指２",
  ring_l_2: "左薬指３",
  ring_r_2: "右薬指３",
  pinky_l_0: "左小指１",
  pinky_r_0: "右小指１",
  pinky_l_1: "左小指２",
  pinky_r_1: "右小指２",
  pinky_l_2: "左小指３",
  pinky_r_2: "右小指３",
}

export const ACTIONS: string[] = ["bend", "turn", "sway"]

export const DIRECTIONS: string[] = ["forward", "backward", "left", "right"]

interface ActionRule {
  sign: number
  axis: "x" | "y" | "z" | "xy" | "xz" | "yz" | "x-y" | "x-z" | "y-z"
  limit: number
}

export const BONE_ACTION_RULES: Record<string, Record<string, Record<string, ActionRule>>> = {
  base: {
    bend: { forward: { sign: -1, axis: "x", limit: 90 }, backward: { sign: 1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 180 }, right: { sign: 1, axis: "y", limit: 180 } },
    sway: { left: { sign: -1, axis: "z", limit: 180 }, right: { sign: 1, axis: "z", limit: 180 } },
  },
  center: {
    bend: { forward: { sign: -1, axis: "x", limit: 90 }, backward: { sign: 1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 180 }, right: { sign: 1, axis: "y", limit: 180 } },
    sway: { left: { sign: -1, axis: "z", limit: 180 }, right: { sign: 1, axis: "z", limit: 180 } },
  },
  head: {
    bend: { forward: { sign: -1, axis: "x", limit: 60 }, backward: { sign: 1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
    sway: { left: { sign: -1, axis: "z", limit: 30 }, right: { sign: 1, axis: "z", limit: 30 } },
  },
  neck: {
    bend: { forward: { sign: -1, axis: "x", limit: 45 }, backward: { sign: 1, axis: "x", limit: 60 } },
    turn: { left: { sign: -1, axis: "y", limit: 75 }, right: { sign: 1, axis: "y", limit: 75 } },
    sway: { left: { sign: -1, axis: "z", limit: 30 }, right: { sign: 1, axis: "z", limit: 30 } },
  },
  upper_body: {
    bend: { forward: { sign: -1, axis: "x", limit: 30 }, backward: { sign: 1, axis: "x", limit: 45 } },
    turn: { left: { sign: -1, axis: "y", limit: 45 }, right: { sign: 1, axis: "y", limit: 45 } },
    sway: { left: { sign: -1, axis: "z", limit: 30 }, right: { sign: 1, axis: "z", limit: 30 } },
  },
  waist: {
    bend: { forward: { sign: -1, axis: "x", limit: 90 }, backward: { sign: 1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 45 }, right: { sign: 1, axis: "y", limit: 45 } },
    sway: { left: { sign: -1, axis: "z", limit: 30 }, right: { sign: 1, axis: "z", limit: 30 } },
  },

  shoulder_l: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 90 } },
    sway: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  shoulder_r: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 90 } },
    sway: { left: { sign: 1, axis: "y", limit: 90 }, right: { sign: -1, axis: "y", limit: 90 } },
  },
  arm_l: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 90 } },
    sway: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  arm_r: {
    bend: { forward: { sign: 1, axis: "x", limit: 45 }, backward: { sign: -1, axis: "x", limit: 180 } },
    sway: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  arm_twist_l: {
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  arm_twist_r: {
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  elbow_l: {
    bend: {
      forward: { sign: 1, axis: "xy", limit: 135 },
    },
  },
  elbow_r: {
    bend: {
      forward: { sign: 1, axis: "x-y", limit: 135 },
    },
  },
  wrist_l: {
    bend: {
      forward: { sign: -1, axis: "z", limit: 60 },
      backward: { sign: 1, axis: "x-z", limit: 30 },
    },
    sway: {
      right: { sign: 1, axis: "xy", limit: 15 },
      left: { sign: -1, axis: "xy", limit: 15 },
    },
  },
  wrist_r: {
    bend: {
      forward: { sign: 1, axis: "z", limit: 60 },
      backward: { sign: -1, axis: "x-z", limit: 30 },
    },
    sway: {
      right: { sign: -1, axis: "x-y", limit: 15 },
      left: { sign: 1, axis: "x-y", limit: 15 },
    },
  },
  wrist_twist_l: {
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },
  wrist_twist_r: {
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
  },

  leg_l: {
    bend: { forward: { sign: 1, axis: "x", limit: 90 }, backward: { sign: -1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
    sway: { left: { sign: 1, axis: "z", limit: 180 }, right: { sign: -1, axis: "z", limit: 30 } },
  },
  leg_r: {
    bend: { forward: { sign: 1, axis: "x", limit: 90 }, backward: { sign: -1, axis: "x", limit: 90 } },
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
    sway: { left: { sign: 1, axis: "z", limit: 30 }, right: { sign: -1, axis: "z", limit: 180 } },
  },
  knee_l: { bend: { backward: { sign: -1, axis: "x", limit: 135 } } },
  knee_r: { bend: { backward: { sign: -1, axis: "x", limit: 135 } } },
  ankle_l: {
    bend: { forward: { sign: -1, axis: "x", limit: 45 }, backward: { sign: 1, axis: "x", limit: 45 } },
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
    sway: { left: { sign: 1, axis: "z", limit: 30 }, right: { sign: -1, axis: "z", limit: 30 } },
  },
  ankle_r: {
    bend: { forward: { sign: -1, axis: "x", limit: 45 }, backward: { sign: 1, axis: "x", limit: 45 } },
    turn: { left: { sign: -1, axis: "y", limit: 90 }, right: { sign: 1, axis: "y", limit: 90 } },
    sway: { left: { sign: 1, axis: "z", limit: 30 }, right: { sign: -1, axis: "z", limit: 30 } },
  },
  forefoot_l: { bend: { forward: { sign: -1, axis: "x", limit: 30 }, backward: { sign: 1, axis: "x", limit: 30 } } },
  forefoot_r: { bend: { forward: { sign: -1, axis: "x", limit: 30 }, backward: { sign: 1, axis: "x", limit: 30 } } },

  thumb_l_0: {
    bend: { forward: { sign: -1, axis: "xy", limit: 90 }, backward: { sign: 1, axis: "xy", limit: 15 } },
    sway: { left: { sign: 1, axis: "z", limit: 45 }, right: { sign: -1, axis: "z", limit: 45 } },
  },
  thumb_l_1: {
    bend: { forward: { sign: -1, axis: "xy", limit: 90 }, backward: { sign: 1, axis: "xy", limit: 15 } },
  },
  thumb_l_2: {
    bend: { forward: { sign: -1, axis: "xy", limit: 90 }, backward: { sign: 1, axis: "xy", limit: 15 } },
  },
  index_l_0: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
    sway: { left: { sign: -1, axis: "x", limit: 15 }, right: { sign: 1, axis: "x", limit: 15 } },
  },
  index_l_1: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  index_l_2: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  middle_l_0: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
    sway: { left: { sign: -1, axis: "x", limit: 45 }, right: { sign: 1, axis: "x", limit: 45 } },
  },
  middle_l_1: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  middle_l_2: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  ring_l_0: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
    sway: { left: { sign: -1, axis: "x", limit: 45 }, right: { sign: 1, axis: "x", limit: 45 } },
  },
  ring_l_1: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  ring_l_2: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  pinky_l_0: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
    sway: { left: { sign: -1, axis: "x", limit: 45 }, right: { sign: 1, axis: "x", limit: 45 } },
  },
  pinky_l_1: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },
  pinky_l_2: {
    bend: { forward: { sign: -1, axis: "z", limit: 90 }, backward: { sign: 1, axis: "z", limit: 15 } },
  },

  thumb_r_0: {
    bend: { forward: { sign: -1, axis: "x-y", limit: 90 }, backward: { sign: 1, axis: "x-y", limit: 15 } },
    sway: { left: { sign: 1, axis: "z", limit: 45 }, right: { sign: -1, axis: "z", limit: 45 } },
  },
  thumb_r_1: {
    bend: { forward: { sign: -1, axis: "x-y", limit: 90 }, backward: { sign: 1, axis: "x-y", limit: 15 } },
  },
  thumb_r_2: {
    bend: { forward: { sign: -1, axis: "x-y", limit: 90 }, backward: { sign: 1, axis: "x-y", limit: 15 } },
  },
  index_r_0: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
    sway: { left: { sign: 1, axis: "x", limit: 15 }, right: { sign: -1, axis: "x", limit: 15 } },
  },
  index_r_1: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  index_r_2: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  middle_r_0: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
    sway: { left: { sign: 1, axis: "x", limit: 45 }, right: { sign: -1, axis: "x", limit: 45 } },
  },
  middle_r_1: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  middle_r_2: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  ring_r_0: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
    sway: { left: { sign: 1, axis: "x", limit: 45 }, right: { sign: -1, axis: "x", limit: 45 } },
  },
  ring_r_1: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  ring_r_2: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  pinky_r_0: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
    sway: { left: { sign: 1, axis: "x", limit: 45 }, right: { sign: -1, axis: "x", limit: 45 } },
  },
  pinky_r_1: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
  pinky_r_2: {
    bend: { forward: { sign: 1, axis: "z", limit: 90 }, backward: { sign: -1, axis: "z", limit: 15 } },
  },
}

export const VALID_STATEMENTS = ((): string[] => {
  const combinations: string[] = []

  for (const [bone, actions] of Object.entries(BONE_ACTION_RULES)) {
    for (const [action, directions] of Object.entries(actions)) {
      for (const direction of Object.keys(directions)) {
        combinations.push(`${bone} ${action} ${direction} ${directions[direction].limit}`)
      }
    }
  }
  return combinations
})()

export interface MPLStatement {
  bone: string
  action: string
  direction: string
  degrees: number
}

export const validateStatement = (input: string): MPLStatement | null => {
  if (input === "") {
    return null
  }
  const segments = input.split(" ")
  if (segments.length !== 4) {
    return null
  }
  const bone = segments[0].toLowerCase() as string
  const action = segments[1].toLowerCase() as string
  const direction = segments[2].toLowerCase() as string
  const degrees = Number(segments[3])

  // Check if the bone-action-direction combination exists and validate degrees
  const boneRules = BONE_ACTION_RULES[bone]
  const actionRules = boneRules?.[action]
  const rule = actionRules?.[direction]

  if (
    !BONES[bone] ||
    !ACTIONS.includes(action) ||
    !DIRECTIONS.includes(direction) ||
    isNaN(degrees) ||
    !rule ||
    degrees > rule.limit
  ) {
    return null
  }
  return {
    bone,
    action,
    direction,
    degrees,
  } as MPLStatement
}

// Helper function to multiply two quaternions
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

// Helper function to process a single statement and return quaternion
const processSingleStatement = (statement: MPLStatement): [number, number, number, number] | null => {
  const { bone, action, direction, degrees } = statement

  const boneRules = BONE_ACTION_RULES[bone]
  const actionRules = boneRules?.[action]
  const rule = actionRules?.[direction]

  if (!rule) {
    return null
  }

  // Apply the sign to degrees
  const signedDegrees = rule.sign * degrees

  const radians = signedDegrees * (Math.PI / 180)
  const halfAngle = radians / 2
  const sin = Math.sin(halfAngle)
  const cos = Math.cos(halfAngle)

  // Create quaternion based on the specified axis
  let quaternion: [number, number, number, number] = [0, 0, 0, 1]
  if (rule.axis === "x") {
    quaternion = [sin, 0, 0, cos] // Rotation around X axis
  } else if (rule.axis === "y") {
    quaternion = [0, sin, 0, cos] // Rotation around Y axis
  } else if (rule.axis === "z") {
    quaternion = [0, 0, sin, cos] // Rotation around Z axis
  } else if (rule.axis === "xy") {
    // Diagonal rotation around the middle of xy (45 degrees between x and y)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [diagonalSin, diagonalSin, 0, cos] // Equal components in x and y
  } else if (rule.axis === "x-y") {
    // Diagonal rotation around x-y (x positive, y negative)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [diagonalSin, -diagonalSin, 0, cos] // x positive, y negative
  } else if (rule.axis === "xz") {
    // Diagonal rotation around the middle of xz (45 degrees between x and z)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [diagonalSin, 0, diagonalSin, cos] // Equal components in x and z
  } else if (rule.axis === "x-z") {
    // Diagonal rotation around x-z (x positive, z negative)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [diagonalSin, 0, -diagonalSin, cos] // x positive, z negative
  } else if (rule.axis === "yz") {
    // Diagonal rotation around the middle of yz (45 degrees between y and z)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [0, diagonalSin, diagonalSin, cos] // Equal components in y and z
  } else if (rule.axis === "y-z") {
    // Diagonal rotation around y-z (y positive, z negative)
    const diagonalSin = sin * Math.cos(Math.PI / 4) // cos(45°) = 1/√2
    quaternion = [0, diagonalSin, -diagonalSin, cos] // y positive, z negative
  } else {
    return null
  }

  return quaternion
}

export const MPLInterpreter = (input: string): Pose | null => {
  // Split input by semicolons and trim whitespace
  const statements = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s !== "")

  if (statements.length === 0) {
    return null
  }

  // Validate all statements first
  const validStatements: MPLStatement[] = []
  for (const statement of statements) {
    const validStatement = validateStatement(statement)
    if (!validStatement) {
      return null // If any statement is invalid, return null
    }
    validStatements.push(validStatement)
  }

  const pose: Pose = {
    description: input,
    face: {} as Morphs,
    movableBones: {} as MovableBones,
    rotatableBones: {} as RotatableBones,
  }

  // Group statements by bone to handle multiple rotations on the same bone
  const boneGroups: Record<string, MPLStatement[]> = {}
  for (const statement of validStatements) {
    if (!boneGroups[statement.bone]) {
      boneGroups[statement.bone] = []
    }
    boneGroups[statement.bone].push(statement)
  }

  // Process each bone group
  for (const [bone, boneStatements] of Object.entries(boneGroups)) {
    let combinedQuaternion: [number, number, number, number] = [0, 0, 0, 1] // Identity quaternion

    // Process all statements for this bone
    for (const statement of boneStatements) {
      const quaternion = processSingleStatement(statement)
      if (quaternion) {
        // Multiply quaternions to combine rotations
        combinedQuaternion = multiplyQuaternions(combinedQuaternion, quaternion)
      }
    }

    // Apply the combined quaternion to the bone
    pose.rotatableBones[BONES[bone] as keyof RotatableBones] = combinedQuaternion
  }

  console.log(pose)
  return pose
}
