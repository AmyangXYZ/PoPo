import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader } from "./ui/card"

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react"
import { MPLToPose, PoseToMPL } from "@/lib/mpl"
import { Textarea } from "./ui/textarea"

const suggestedPoses: string[] = [
  "look down",
  "arms down",
  "bend over and look right",
  "tilting left",
] as const

export default function ChatInput({ setMplStatement }: { setMplStatement: Dispatch<SetStateAction<string>> }) {
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
      setWaitingPoseResult(true)
      // setShowSuggestions(false)

      const poseRes = await fetch("/api/pose-generate", {
        method: "POST",
        body: JSON.stringify({ description }),
      })
      const resp = await poseRes.json()
      setDescription("")
      if (resp.mpl) {
        const pose = MPLToPose(resp.mpl)
        if (pose) {
          setMplStatement(PoseToMPL(pose).replaceAll(";", ";\n"))
        }
      }
      setWaitingPoseResult(false)
    },
    [setMplStatement]
  )

  return (
    <>
      <div className="relative w-full flex flex-col gap-3">
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
                className={`bg-white/50 hover:bg-pink-100/70 py-0 gap-0 h-full w-full cursor-pointer backdrop-blur-[3px] shadow-lg ${i >= 2 ? "hidden md:block" : ""
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


        <div className="relative w-full">
          <Textarea
            className="max-h-[calc(75dvh)] md:text-base overflow-hidden resize-none bg-white/50 text-zinc-800 backdrop-blur-[3px] shadow-lg px-4"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg z-10">
              <div className="h-5 w-5 border-2 border-zinc-200 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="absolute bottom-2.5 right-2.5 w-fit flex flex-row justify-end">
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
