import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader } from "./ui/card"

import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from "react"
import { Pose, MovableBones } from "@/lib/pose"
import { Quaternion } from "@babylonjs/core/Maths/math.vector"

const suggestedPoses: string[] = [
  "left hand thumb up",
  "squat with right hand fist",
  "lift left leg with shocked expression",
  "sit with fingers apart both hands",
  "bend and look right with a shy smile",
  "turn around with smile",
  "standing with body and head tilted left",
  "gun left hand with serious expression",
  "I broke with my girlfriend",
] as const

export default function ChatInput({
  setPose,
  setSmoothUpdate,
}: {
  setPose: Dispatch<SetStateAction<Pose>>
  setSmoothUpdate: (smoothUpdate: boolean) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [waitingPoseResult, setWaitingPoseResult] = useState(false)
  const [displayedPoses, setDisplayedPoses] = useState<string[]>([])

  // Function to get 4 random poses
  const getRandomPoses = () => {
    const shuffled = [...suggestedPoses].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 4)
  }

  // Initialize with random poses on component mount
  useEffect(() => {
    setDisplayedPoses(getRandomPoses())
  }, [])

  const [description, setDescription] = useState("")

  const generatePose = useCallback(
    async (description: string) => {
      resetHeight()
      setWaitingPoseResult(true)
      setShowSuggestions(false)

      const poseRes = await fetch("/api/pose-generate", {
        method: "POST",
        body: JSON.stringify({ description }),
      })
      const poseData = await poseRes.json()
      setDescription("")
      setSmoothUpdate(true)
      const quat = new Quaternion(0, 0, 0, 0)
      for (const bone in poseData.result.rotatableBones) {
        const rawQuat = poseData.result.rotatableBones[bone]
        quat.set(rawQuat[0], rawQuat[1], rawQuat[2], rawQuat[3])
        quat.normalize()
        poseData.result.rotatableBones[bone] = [quat.x, quat.y, quat.z, quat.w]
      }
      setPose((prev) => ({
        ...prev,
        description: poseData.result.description || prev.description,
        face: { ...prev.face, ...poseData.result.face },
        movableBones: { ...prev.movableBones, ...poseData.result.movableBones } as MovableBones,
        rotatableBones: { ...prev.rotatableBones, ...poseData.result.rotatableBones },
      }))
      console.log(poseData)
      setWaitingPoseResult(false)
      // Get new random poses for next time
      setDisplayedPoses(getRandomPoses())
    },
    [setPose, setSmoothUpdate]
  )

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight()
    }
  }, [])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
    }
  }

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }
  return (
    <>
      <div className="relative w-full flex flex-col gap-3">
        {showSuggestions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {displayedPoses.map((pose, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * i }}
                key={`suggested-pose-${pose}-${i}`}
                className={i > 1 ? "hidden sm:block" : "block"}
              >
                <Card
                  key={i}
                  className={`bg-white/50 hover:bg-pink-100/70 py-0 gap-0 h-full w-full cursor-pointer backdrop-blur-[3px] shadow-lg ${
                    i >= 2 ? "hidden md:block" : ""
                  }`}
                  onClick={() => {
                    generatePose(pose)
                  }}
                >
                  <CardHeader className="py-2 gap-0">
                    <CardDescription className="py-1 text-zinc-800 ">{pose}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-white/50 text-zinc-800 pb-4 backdrop-blur-[3px] shadow-lg px-4"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              adjustHeight()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && description.trim().length > 0) {
                e.preventDefault()
                generatePose(description)
              }
            }}
            disabled={false}
            placeholder={"Pose me as you would like to see me ..."}
          />
          {waitingPoseResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl z-10">
              <div className="h-6 w-6 border-3 border-zinc-200 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            size="icon"
            className="rounded-full h-fit w-fit p-1"
            disabled={description.length === 0}
            onClick={() => generatePose(description)}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
