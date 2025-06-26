export interface Pose {
  description: string
  face: Morphs
  movableBones: MovableBones
  rotatableBones: RotatableBones
}

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

export type BonePosition = {
  x: number
  y: number
  z: number
}

export type BoneRotationQuaternion = {
  x: number
  y: number
  z: number
  w: number
}

export interface MovableBones {
  センター: BonePosition
  左足ＩＫ: BonePosition
  右足ＩＫ: BonePosition
  右つま先ＩＫ: BonePosition
  左つま先ＩＫ: BonePosition
}

export interface RotatableBones {
  首: BoneRotationQuaternion
  頭: BoneRotationQuaternion
  上半身: BoneRotationQuaternion
  下半身: BoneRotationQuaternion
  左足: BoneRotationQuaternion
  右足: BoneRotationQuaternion
  左ひざ: BoneRotationQuaternion
  右ひざ: BoneRotationQuaternion
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

export const KeyMorphs = [
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

export const KeyBones = [
  "センター",
  "首",
  "頭",
  "上半身",
  "下半身",
  "左足",
  "右足",
  "左ひざ",
  "右ひざ",
  "左足首",
  "右足首",
  "左腕",
  "右腕",
  "左ひじ",
  "右ひじ",
  "左足ＩＫ",
  "右足ＩＫ",
  "右つま先ＩＫ",
  "左つま先ＩＫ",
  "左目",
  "右目",
  "左手首",
  "右手首",
  "右親指１",
  "右親指２",
  "右人指１",
  "右人指２",
  "右人指３",
  "右中指１",
  "右中指２",
  "右中指３",
  "右薬指１",
  "右薬指２",
  "右薬指３",
  "右小指１",
  "右小指２",
  "右小指３",
  "左親指１",
  "左親指２",
  "左人指１",
  "左人指２",
  "左人指３",
  "左中指１",
  "左中指２",
  "左中指３",
  "左薬指１",
  "左薬指２",
  "左薬指３",
  "左小指１",
  "左小指２",
  "左小指３",
]
