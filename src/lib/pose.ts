export interface Pose {
  face: MorphTargets
  body: BoneTargets
}

export interface MorphTargets {
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

export interface BoneTargetValue {
  position?: [number, number, number]
  rotation: [number, number, number, number]
}

export interface BoneTargets {
  // position x,y,z
  センター: BoneTargetValue
  左足ＩＫ: BoneTargetValue
  右足ＩＫ: BoneTargetValue
  右つま先ＩＫ: BoneTargetValue
  左つま先ＩＫ: BoneTargetValue
  // rotation x,y,z,w (quaternion)
  首: BoneTargetValue
  頭: BoneTargetValue
  上半身: BoneTargetValue
  下半身: BoneTargetValue
  左足: BoneTargetValue
  右足: BoneTargetValue
  左ひざ: BoneTargetValue
  右ひざ: BoneTargetValue
  左足首: BoneTargetValue
  右足首: BoneTargetValue
  左腕: BoneTargetValue
  右腕: BoneTargetValue
  左ひじ: BoneTargetValue
  右ひじ: BoneTargetValue
  左目: BoneTargetValue
  右目: BoneTargetValue
  左手首: BoneTargetValue
  右手首: BoneTargetValue
  右親指１: BoneTargetValue
  右親指２: BoneTargetValue
  右人指１: BoneTargetValue
  右人指２: BoneTargetValue
  右人指３: BoneTargetValue
  右中指１: BoneTargetValue
  右中指２: BoneTargetValue
  右中指３: BoneTargetValue
  右薬指１: BoneTargetValue
  右薬指２: BoneTargetValue
  右薬指３: BoneTargetValue
  右小指１: BoneTargetValue
  右小指２: BoneTargetValue
  右小指３: BoneTargetValue
  左親指１: BoneTargetValue
  左親指２: BoneTargetValue
  左人指１: BoneTargetValue
  左人指２: BoneTargetValue
  左人指３: BoneTargetValue
  左中指１: BoneTargetValue
  左中指２: BoneTargetValue
  左中指３: BoneTargetValue
  左薬指１: BoneTargetValue
  左薬指２: BoneTargetValue
  左薬指３: BoneTargetValue
  左小指１: BoneTargetValue
  左小指２: BoneTargetValue
  左小指３: BoneTargetValue
}

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
