import { Paperclip } from "lucide-react"

import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader } from "./ui/card"

import { useState, useEffect, useRef, ChangeEvent, useCallback, Dispatch, SetStateAction } from "react"
import Image from "next/image"
import { Skeleton } from "./ui/skeleton"
import { Pose, MovableBones } from "@/lib/pose"

const suggestedPoses: string[] = [
  "look right with a shy smile",
  "angry face while lifting left foot",
  "squatting down and cry",
  "point forward with shocked look",
  "waving with both hands excitedly",
  "sitting cross-legged with hands on knees",
  "stretching arms up high with a yawn",
  "covering face with hands shyly",
  "dancing with one leg up",
  "holding chin thoughtfully",
  "jumping with arms spread wide",
  "lying down reading a book",
  "standing on one foot balancing",
  "clapping hands with joy",
  "looking over shoulder mysteriously",
  "kneeling down to pet an imaginary cat",
  "doing a peace sign with tongue out",
  "hands on hips looking confident",
  "crouching like a ninja",
  "spinning around with arms out",
  "sitting with legs dangling",
  "flexing muscles proudly",
  "tiptoeing sneakily",
  "giving a thumbs up with a wink",
  "hugging knees while sitting",
  "doing jazz hands",
  "leaning against an invisible wall",
  "pretending to sleep standing up",
  "making heart shape with hands",
  "doing a superhero pose",
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
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    if (fileUrl.length > 0) {
      setShowSuggestions(false)
    }
  }, [fileUrl])

  const [description, setDescription] = useState("")

  const generatePose = useCallback(
    async (description: string, fileUrl: string) => {
      resetHeight()
      setWaitingPoseResult(true)
      setShowSuggestions(false)
      const poseRes = await fetch("/api/pose-generate", {
        method: "POST",
        body: JSON.stringify({ description, fileUrl }),
      })
      const poseData = await poseRes.json()
      setDescription("")
      setFileUrl("")
      setSmoothUpdate(true)
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileUrl("")
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // 1. Get presigned upload URL and public file URL from your API
      const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}`)
      const { uploadUrl, fileUrl: publicUrl, error: apiError } = await res.json()
      if (!uploadUrl) throw new Error(apiError || "Failed to get upload URL")

      // 2. Upload the file to R2 using the presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })
      if (!uploadRes.ok) throw new Error("Upload failed")

      // 3. Show the public file URL
      setFileUrl(publicUrl)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

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
        {showSuggestions && !uploading && !fileUrl.length && (
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
                    generatePose(pose, "")
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

        {fileUrl.length > 0 && fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div className="w-full flex justify-start">
            <div className="w-[180px] h-[120px] border-2 border-zinc-100 rounded-xl shadow-lg overflow-hidden">
              <Image src={fileUrl} alt="Uploaded" width={160} height={100} className="object-cover w-full h-full" />
            </div>
          </div>
        )}
        {uploading && (
          <div className="w-full flex justify-start">
            <Skeleton className="w-[180px] h-[120px] rounded-xl" />
          </div>
        )}

        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-white/50 text-zinc-800 pb-8 md:pb-10 backdrop-blur-[3px] shadow-lg px-4"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              adjustHeight()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && description.trim().length > 0) {
                e.preventDefault()
                generatePose(description, fileUrl)
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
        <div className="absolute bottom-0 p-1 w-fit flex flex-row justify-start">
          <Button size="icon" variant="ghost" disabled={false} onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="size-4.5" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Button>
        </div>
        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            size="icon"
            className="rounded-full h-fit w-fit p-1"
            disabled={description.length === 0}
            onClick={() => generatePose(description, fileUrl)}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
