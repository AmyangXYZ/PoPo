import { useCallback, useState, useEffect } from "react"
import { Button } from "./ui/button"
import { CloudCheck, Download, Upload, ImageIcon } from "lucide-react"
import { useMPLCompiler } from "@/hooks/useMPLCompiler"
import { MPLBoneFrame } from "mmd-mpl"
import CodeEditor from "./code-editor"
import Link from "next/link"
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { generatePoseId } from "@/lib/utils"
import { Copy } from "lucide-react"
import { Pose } from "@/lib/database"

export default function MPLEditor({
  loadVPD,
  modelLoaded,
  loadVMD,
  pose,
}: {
  loadVPD: (url: string) => Promise<MPLBoneFrame[] | null>
  loadVMD: (url: string) => void
  modelLoaded: boolean
  pose: Pose | null
}) {
  const mplCompiler = useMPLCompiler()
  const [vmdUrl, setVmdUrl] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [poseName, setPoseName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const { isSignedIn } = useUser()

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setErrorMessage(null)
      // You could add a success message here if needed
    } catch {
      setErrorMessage("Failed to copy to clipboard")
    }
  }, [])

  const resetSuccessState = useCallback(() => {
    setPoseName("")
    setPreviewImageUrl(null)
    setShareUrl(null)
    setIsPublished(false)
    setErrorMessage(null)
  }, [])

  const [statement, setStatement] = useState(pose?.mpl || `@pose welcome {
    upper_body bend forward 12;
    upper_body sway left 9;
    shoulder_r bend backward 13;
    shoulder_r sway left 4;
    ankle_r bend forward 60;
    ankle_r turn left 4;
    ankle_r sway left 5;
    knee_l bend backward 34;
    ankle_l bend forward 43;
    ankle_l turn right 2;
    ankle_l sway right 1;
    upper_body2 bend backward 9;
    upper_body2 turn left 1;
    upper_body2 sway right 14;
    neck bend forward 9;
    neck turn right 7;
    neck sway right 13;
    arm_twist_r turn right 5;
    elbow_r bend forward 135;
    wrist_twist_r turn right 27;
    wrist_r bend backward 30;
    thumb_0_r bend backward 3;
    thumb_0_r sway left 6;
    pinky_0_r bend backward 15;
    pinky_0_r sway right 3;
    pinky_1_r bend forward 18;
    ring_0_r bend backward 13;
    ring_0_r sway right 1;
    ring_1_r bend forward 18;
    middle_1_r bend forward 23;
    index_0_r bend forward 17;
    index_0_r sway right 3;
    index_1_r bend forward 21;
    shoulder_l bend backward 14;
    shoulder_l sway left 2;
    arm_l bend forward 6;
    arm_twist_l turn left 18;
    elbow_l bend forward 135;
    wrist_twist_l turn left 16;
    wrist_l sway left 12;
    thumb_2_l bend forward 20;
    pinky_1_l bend forward 32;
    ring_1_l bend forward 32;
    middle_1_l bend forward 42;
    index_1_l bend forward 54;
    leg_r bend forward 19;
    leg_r turn right 8;
    leg_r sway left 1;
    leg_l bend forward 32;
    leg_l turn left 3;
    leg_l sway left 1;
}

@pose kick_left {
    leg_l bend forward 30;
    knee_l bend backward 0;
    leg_r bend backward 20;
    knee_r bend backward 15;
}

@pose kick_right {
    leg_r bend forward 30;
    knee_r bend backward 0;
    leg_l bend backward 20;
    knee_l bend backward 15;
}

@animation walk {
    0: kick_left;
    0.3: kick_right;
    0.6: kick_left;
    0.9: kick_right;
}
    
@animation love {
    1.2: welcome;
}
    
main {
    walk;
    love;
}`)

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.name.endsWith(".vpd")) {
        const url = URL.createObjectURL(file)
        const boneStates = await loadVPD(url)
        if (boneStates && mplCompiler) {
          const statements = mplCompiler.reverse_compile("vpd_pose", boneStates)
          setStatement(statements)
        }
      }

      event.target.value = ""
    },
    [setStatement, loadVPD, mplCompiler]
  )

  useEffect(() => {
    if (modelLoaded && mplCompiler) {
      try {
        const vmdBytes = mplCompiler.compile(statement)
        setCompileError(null)
        if (vmdBytes.length === 0) {
          loadVMD("")
          setVmdUrl(null)
          return
        }
        // Create a blob from the raw VMD bytes
        const vmdBlob = new Blob([vmdBytes], { type: "application/octet-stream" })
        const vmdUrl = URL.createObjectURL(vmdBlob)
        loadVMD(vmdUrl)
        setVmdUrl(vmdUrl)

        // Clean up the URL when component unmounts or statement changes
        return () => {
          URL.revokeObjectURL(vmdUrl)
        }
      } catch (error) {
        setCompileError(error as string)
      }
    }
  }, [statement, modelLoaded, mplCompiler, loadVMD])



  const handlePreviewImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSignedIn) {
        setErrorMessage("Please login to upload a preview image")
        return
      }

      const file = event.target.files?.[0]
      if (!file) return

      setIsUploading(true)
      setErrorMessage(null)

      try {
        // Upload to server API
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setPreviewImageUrl(data.url)
        } else {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to upload image")
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to upload image")
      } finally {
        setIsUploading(false)
      }

      event.target.value = ""
    },
    [isSignedIn]
  )

  const publishPose = useCallback(async () => {
    if (!isSignedIn) {
      alert("Please login to publish your pose")
      return
    }

    if (!previewImageUrl) {
      setErrorMessage("Please upload a preview image first")
      return
    }

    if (!poseName.trim()) {
      setErrorMessage("Please enter a pose name")
      return
    }

    // Generate unique pose UID
    const poseUid = generatePoseId(statement, poseName.trim(), previewImageUrl)

    const response = await fetch("/api/pose-publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: poseUid,
        mpl: statement,
        name: poseName.trim(),
        preview_url: previewImageUrl,
      }),
    })
    const data = await response.json()
    if (data.success) {
      // Create shareable URL
      const shareUrl = `${window.location.origin}/playground/${poseUid}`
      setShareUrl(shareUrl)
      setIsPublished(true)
      setErrorMessage(null)
    } else {
      setErrorMessage("Failed to publish pose")
    }
  }, [statement, previewImageUrl, poseName, isSignedIn])

  return (
    <div className="flex flex-col gap-1 w-full h-full pt-10">
      <div className="flex flex-row gap-2 px-6 pt-2 z-100 items-center justify-between">
        <Link href="https://github.com/AmyangXYZ/MMD-MPL" target="_blank">
          <h3 className="scroll-m-20 text-lg font-semibold tracking-tight hidden md:block">
            MMD Pose Language (MPL) Editor
          </h3>
        </Link>
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight md:hidden">MPL Editor</h3>
        <div className="flex flex-row gap-2">
          <div className="relative hidden md:block">
            <input
              type="file"
              accept=".vpd"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="pose-upload"
            />
            <Button
              onClick={() => {
                setStatement("")
              }}
              className="flex"
              size="sm"
            >
              <Upload className="size-4" />
              <span className="text-xs">Upload VPD</span>
            </Button>
          </div>

          <Button
            onClick={() => {
              if (vmdUrl) {
                const a = document.createElement("a")
                a.href = vmdUrl
                a.download = "animation.vmd"
                a.click()
              }
            }}
            disabled={!vmdUrl}
            className="flex cursor-pointer"
            size="sm"
          >
            <Download className="size-4" />
            <span className="text-xs">Download VMD</span>
          </Button>

          <Dialog onOpenChange={(open) => {
            if (!open && isPublished) {
              resetSuccessState()
            }
          }}>
            <form onSubmit={(e) => e.preventDefault()}>
              <DialogTrigger asChild>
                <Button className="flex cursor-pointer" size="sm" disabled={!vmdUrl}>
                  <CloudCheck className="size-4" />
                  <span className="text-xs">Publish</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isPublished ? "Pose Published!" : "Publish Pose"}</DialogTitle>
                  <DialogDescription>
                    {isPublished ? "Your pose has been successfully published to the gallery." : "Publish your pose to the gallery."}
                  </DialogDescription>
                </DialogHeader>

                {!isPublished ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="name-1">Name</Label>
                      <Input name="name" value={poseName} onChange={(e) => setPoseName(e.target.value)} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="preview-image">Preview Image</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePreviewImageUpload}
                          className="hidden"
                          id="preview-image"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("preview-image")?.click()}
                          className="flex items-center gap-2"
                          disabled={isUploading}
                        >
                          <ImageIcon className="size-4" />
                          {isUploading ? "Uploading..." : "Upload Image"}
                        </Button>
                      </div>
                      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                      {previewImageUrl && (
                        <div className="mt-2">
                          <Image
                            src={previewImageUrl}
                            alt="Preview"
                            width={128}
                            height={128}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-green-500 text-5xl mb-2">✓</div>
                      <p className="text-lg font-semibold text-green-600">Published!</p>
                    </div>

                    {shareUrl && (
                      <div className="">
                        <p className="text-blue-500 text-sm mb-2">Link:</p>

                        <div className="flex items-center gap-2">

                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono bg-gray-100 px-2 py-2 rounded-md flex-1 break-all hover:bg-gray-200 transition-colors cursor-pointer text-blue-600 underline"
                          >
                            {shareUrl}
                          </a>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(shareUrl)}
                            className="flex-shrink-0"
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  {!isPublished ? (
                    <>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="button" onClick={publishPose}>
                        Submit
                      </Button>
                    </>
                  ) : (
                    <DialogClose asChild>
                      <Button>Close</Button>
                    </DialogClose>
                  )}
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 py-2 px-6">
        <CodeEditor value={statement} onChange={setStatement} />
        {compileError && <div className="text-red-700 text-sm font-mono mt-2 font-medium">{compileError}</div>}
      </div>
    </div>
  )
}
