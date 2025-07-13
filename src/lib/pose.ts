export interface Pose {
  description: string
  face: Morphs
  movableBones: MovableBones
  rotatableBones: RotatableBones
}

export type BonePosition = [number, number, number] // [x, y, z]

export type BoneRotationQuaternion = [number, number, number, number] // [x, y, z, w]

export interface Morphs {
  // Basic expressions
  真面目: number // Serious/Neutral
  困る: number // Troubled/Worried
  にこり: number // Smile
  怒り: number // Angry

  // Eye expressions
  まばたき: number // Blink
  笑い: number // Laughing eyes
  ウィンク: number // Wink
  ウィンク右: number // Wink Right
  ウィンク２: number // Wink 2
  ｳｨﾝｸ２右: number // Wink 2 Right
  なごみ: number // Calm/Relaxed
  びっくり: number // Surprised
  "恐ろしい子！": number // Scary child!
  はちゅ目: number // Hachu eyes
  はぅ: number // Haa
  ｷﾘｯ: number // Kiritsu (determined)
  眼睑上: number // Upper eyelid
  眼角下: number // Lower eye corner
  じと目: number // Dull eyes
  じと目1: number // Dull eyes 1

  // Mouth shapes
  あ: number // Mouth "A"
  い: number // Mouth "I"
  う: number // Mouth "U"
  え: number // Mouth "E"
  お: number // Mouth "O"
  お1: number // Mouth "O" 1

  // Mouth expressions
  口角上げ: number // Mouth corners up
  口角下げ: number // Mouth corners down
  口角下げ1: number // Mouth corners down 1
  口横缩げ: number // Mouth horizontal shrink
  口横広げ: number // Mouth horizontal expand
  にやり２: number // Grin 2
  にやり２1: number // Grin 2 1

  // Special effects
  照れ: number // Embarrassed
}

export interface MovableBones {
  全ての親: BonePosition
  センター: BonePosition
  左足ＩＫ: BonePosition
  右足ＩＫ: BonePosition
  右つま先ＩＫ: BonePosition
  左つま先ＩＫ: BonePosition
}

export interface RotatableBones {
  全ての親: BoneRotationQuaternion
  センター: BoneRotationQuaternion
  首: BoneRotationQuaternion
  頭: BoneRotationQuaternion
  腰: BoneRotationQuaternion
  上半身: BoneRotationQuaternion
  下半身: BoneRotationQuaternion
  左肩: BoneRotationQuaternion
  右肩: BoneRotationQuaternion
  左足: BoneRotationQuaternion
  右足: BoneRotationQuaternion
  左足首: BoneRotationQuaternion
  右足首: BoneRotationQuaternion
  左腕: BoneRotationQuaternion
  右腕: BoneRotationQuaternion
  左ひじ: BoneRotationQuaternion
  右ひじ: BoneRotationQuaternion
  左目: BoneRotationQuaternion
  右目: BoneRotationQuaternion
  左手首: BoneRotationQuaternion
  右手首: BoneRotationQuaternion
  右親指１: BoneRotationQuaternion
  右親指２: BoneRotationQuaternion
  右人指１: BoneRotationQuaternion
  右人指２: BoneRotationQuaternion
  右人指３: BoneRotationQuaternion
  右中指１: BoneRotationQuaternion
  右中指２: BoneRotationQuaternion
  右中指３: BoneRotationQuaternion
  右薬指１: BoneRotationQuaternion
  右薬指２: BoneRotationQuaternion
  右薬指３: BoneRotationQuaternion
  右小指１: BoneRotationQuaternion
  右小指２: BoneRotationQuaternion
  右小指３: BoneRotationQuaternion
  左親指１: BoneRotationQuaternion
  左親指２: BoneRotationQuaternion
  左人指１: BoneRotationQuaternion
  左人指２: BoneRotationQuaternion
  左人指３: BoneRotationQuaternion
  左中指１: BoneRotationQuaternion
  左中指２: BoneRotationQuaternion
  左中指３: BoneRotationQuaternion
  左薬指１: BoneRotationQuaternion
  左薬指２: BoneRotationQuaternion
  左薬指３: BoneRotationQuaternion
  左小指１: BoneRotationQuaternion
  左小指２: BoneRotationQuaternion
  左小指３: BoneRotationQuaternion
}

export const MorphsTranslations = {
  // Basic expressions
  真面目: "Serious",
  困る: "Troubled",
  にこり: "Smile",
  怒り: "Angry",

  // Eye expressions
  まばたき: "Blink",
  笑い: "Laughing Eyes",
  ウィンク: "Wink",
  ウィンク右: "Wink Right",
  ウィンク２: "Wink 2",
  ｳｨﾝｸ２右: "Wink 2 Right",
  なごみ: "Calm",
  びっくり: "Surprised",
  "恐ろしい子！": "Scary Child!",
  はちゅ目: "Hachu Eyes",
  はぅ: "Haa",
  ｷﾘｯ: "Determined",
  眼睑上: "Upper Eyelid",
  眼角下: "Lower Eye Corner",
  じと目: "Dull Eyes",
  じと目1: "Dull Eyes 1",

  // Mouth shapes
  あ: "Mouth A",
  い: "Mouth I",
  う: "Mouth U",
  え: "Mouth E",
  お: "Mouth O",
  お1: "Mouth O 1",

  // Mouth expressions
  口角上げ: "Mouth Up",
  口角下げ: "Mouth Down",
  口角下げ1: "Mouth Down 1",
  口横缩げ: "Mouth Narrow",
  口横広げ: "Mouth Wide",
  にやり２: "Grin 2",
  にやり２1: "Grin 2 1",

  // Special effects
  照れ: "Embarrassed",
} as const

export const MovableBonesTranslations = {
  全ての親: "All Parents",
  センター: "Center",
  左足ＩＫ: "Left Foot",
  右足ＩＫ: "Right Foot",
  右つま先ＩＫ: "Right Toe",
  左つま先ＩＫ: "Left Toe",
} as const

export const RotatableBonesTranslations = {
  全ての親: "All Parents",
  センター: "Center",
  上半身: "Upper Body",
  下半身: "Lower Body",
  左肩: "Left Shoulder",
  右肩: "Right Shoulder",
  腰: "Waist",
  首: "Neck",
  頭: "Head",
  左足: "Left Leg",
  右足: "Right Leg",
  左足首: "Left Ankle",
  右足首: "Right Ankle",
  左腕: "Left Arm",
  右腕: "Right Arm",
  左ひじ: "Left Elbow",
  右ひじ: "Right Elbow",
  左目: "Left Eye",
  右目: "Right Eye",
  左手首: "Left Wrist",
  右手首: "Right Wrist",
  右親指１: "Right Thumb 1",
  右親指２: "Right Thumb 2",
  右人指１: "Right Index 1",
  右人指２: "Right Index 2",
  右人指３: "Right Index 3",
  右中指１: "Right Middle 1",
  右中指２: "Right Middle 2",
  右中指３: "Right Middle 3",
  右薬指１: "Right Ring 1",
  右薬指２: "Right Ring 2",
  右薬指３: "Right Ring 3",
  右小指１: "Right Pinky 1",
  右小指２: "Right Pinky 2",
  右小指３: "Right Pinky 3",
  左親指１: "Left Thumb 1",
  左親指２: "Left Thumb 2",
  左人指１: "Left Index 1",
  左人指２: "Left Index 2",
  左人指３: "Left Index 3",
  左中指１: "Left Middle 1",
  左中指２: "Left Middle 2",
  左中指３: "Left Middle 3",
  左薬指１: "Left Ring 1",
  左薬指２: "Left Ring 2",
  左薬指３: "Left Ring 3",
  左小指１: "Left Pinky 1",
  左小指２: "Left Pinky 2",
  左小指３: "Left Pinky 3",
} as const
