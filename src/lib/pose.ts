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

export interface BoneTargets {
  // position x,y,z
  センター: [number, number, number]
  左足ＩＫ: [number, number, number]
  右足ＩＫ: [number, number, number]
  // rotation x,y,z
  首: [number, number, number]
  頭: [number, number, number]
  上半身: [number, number, number]
  下半身: [number, number, number]
  左足: [number, number, number]
  右足: [number, number, number]
  左ひざ: [number, number, number]
  右ひざ: [number, number, number]
  左足首: [number, number, number]
  右足首: [number, number, number]
  左腕: [number, number, number]
  右腕: [number, number, number]
  左ひじ: [number, number, number]
  右ひじ: [number, number, number]
  左目: [number, number, number]
  右目: [number, number, number]
  左手首: [number, number, number]
  右手首: [number, number, number]
  右親指１: [number, number, number]
  右親指２: [number, number, number]
  右人指１: [number, number, number]
  右人指２: [number, number, number]
  右人指３: [number, number, number]
  右中指１: [number, number, number]
  右中指２: [number, number, number]
  右中指３: [number, number, number]
  右薬指１: [number, number, number]
  右薬指２: [number, number, number]
  右薬指３: [number, number, number]
  右小指１: [number, number, number]
  右小指２: [number, number, number]
  右小指３: [number, number, number]
  左親指１: [number, number, number]
  左親指２: [number, number, number]
  左人指１: [number, number, number]
  左人指２: [number, number, number]
  左人指３: [number, number, number]
  左中指１: [number, number, number]
  左中指２: [number, number, number]
  左中指３: [number, number, number]
  左薬指１: [number, number, number]
  左薬指２: [number, number, number]
  左薬指３: [number, number, number]
  左小指１: [number, number, number]
  左小指２: [number, number, number]
  左小指３: [number, number, number]
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
