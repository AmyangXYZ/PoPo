import { Paperclip } from "lucide-react"

import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader } from "./ui/card"

import { useState, useEffect, useRef, ChangeEvent } from "react"
import Image from "next/image"
import { Skeleton } from "./ui/skeleton"
import { MorphTargets } from "@/lib/pose"

const suggestedPoses: string[] = [
  "give me a shy smile",
  "look exhausted 24h no sleep",
  "burst out laughing with mouth wide open",
  "cold, boring, unimpressed stare"
] as const

export default function ChatInput({ setPose }: { setPose: (pose: MorphTargets) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [waitingPoseResult, setWaitingPoseResult] = useState(false)

  useEffect(() => {
    if (fileUrl.length > 0) {
      setShowSuggestions(false)
    }
  }, [fileUrl])

  const [description, setDescription] = useState("")

  const setMMDPose = async (description: string, fileUrl: string) => {
    setDescription("")
    setFileUrl("")
    resetHeight()
    setWaitingPoseResult(true)
    setShowSuggestions(false)
    const poseRes = await fetch("/api/pose-generate", {
      method: "POST",
      body: JSON.stringify({ description }),
    })
    const poseData = await poseRes.json()
    if (fileUrl.length > 0) {
      console.log(fileUrl)
    }
    setPose(poseData.result)
    setWaitingPoseResult(false)
  }

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
      <div className="relative w-full flex flex-col gap-4">
        {showSuggestions && !uploading && !fileUrl.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedPoses.map((pose, i) => (
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
                  className={`bg-white/50 hover:bg-pink-100/70 py-0 gap-0 h-full w-full cursor-pointer backdrop-blur-xs shadow-lg ${i >= 2 ? "hidden md:block" : ""
                    }`}
                  onClick={() => {
                    setMMDPose(pose, "")
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
            className="max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-white/50 text-zinc-800 pb-8 md:pb-10 backdrop-blur-xs shadow-lg px-4"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              adjustHeight()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && description.trim().length > 0) {
                e.preventDefault()
                setMMDPose(description, fileUrl)
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
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={uploading} />
          </Button>
        </div>
        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            size="icon"
            className="rounded-full h-fit w-fit p-1"
            disabled={description.length === 0}
            onClick={() => setMMDPose(description, fileUrl)}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
