import { useCallback, useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { CloudCheck, Download, Upload, ImageIcon } from "lucide-react"
import { useMPLCompiler } from "@/hooks/useMPLCompiler"
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
import { FilesetResolver, HolisticLandmarker } from "@mediapipe/tasks-vision"
import { Solver } from "@/lib/mediapipe_solver"

export default function MPLEditor({
  modelLoaded,
  loadVMD,
  pose,
}: {
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

  const [statement, setStatement] = useState(
    pose?.mpl ||
      `@pose stand {
    center move up 0, sway left 5, turn right 5, bend forward 5;
    upper_body sway right 5, bend backward 5;
    lower_body turn left 5;
    neck turn left 10, bend forward 10, sway right 5;
    head turn left 20, bend forward 20;
    shoulder_l turn right 5, sway left 10, bend backward 20;
    shoulder_r turn right 5, bend backward 10, sway left 10;
    arm_l bend forward 60;
    arm_r bend forward 45;
    elbow_l bend forward 15;
    elbow_r bend forward 15;
    wrist_l sway left 15;
    wrist_r turn left 5, bend backward 10, sway right 15;
    leg_l turn left 10;
    leg_r turn right 5, bend forward 20, sway left 10;
    knee_l bend backward 5;
    knee_r bend backward 5;
    ankle_l bend backward 15, sway left 5;
    ankle_r bend forward 5, turn left 10, sway right 5;
    toe_l bend forward 5;
    toe_r bend forward 5;
}

@pose hand_relax {
    thumb_l bend forward 10;
    index_l bend forward 45;
    middle_l sway right 5, bend forward 55;
    ring_l sway right 5, bend forward 55;
    pinky_l bend forward 60, sway right 5;
    thumb_r bend forward 10, sway left 5;
    index_r sway right 5, bend forward 35;
    middle_r sway right 5, bend forward 50;
    ring_r sway left 5, bend forward 60;
    pinky_r sway left 10, bend forward 55;
}

@pose kick {
    leg_l bend forward 120;
    knee_l bend backward 10;
}

@pose look {
    head reset;
    neck reset;
}

@animation hello {
    0: stand & hand_relax;
    1: kick;
    1.2: look;
}

main {
    hello;
}
`
  )
  const holisticLandmarkerRef = useRef<HolisticLandmarker | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const detectLandmarks = useCallback(async (): Promise<Blob | null> => {
    if (!holisticLandmarkerRef.current) {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      holisticLandmarkerRef.current = await HolisticLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
      })
    }

    await holisticLandmarkerRef.current?.setOptions({ runningMode: "IMAGE" })

    if (
      imageRef.current &&
      imageRef.current.src.length > 0 &&
      imageRef.current.complete &&
      imageRef.current.naturalWidth > 0
    ) {
      let vpdBlob: Blob | null = null
      holisticLandmarkerRef.current!.detect(imageRef.current, (result) => {
        if (result.poseWorldLandmarks.length > 0) {
          const solver = new Solver()
          solver.solve(result)
          vpdBlob = solver.exportToVpdBlob("pose_from_image")
        }
      })
      return vpdBlob
    }
    return null
  }, [])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.name.endsWith(".vpd")) {
        if (mplCompiler) {
          try {
            const statements = mplCompiler.reverse_compile("vpd", new Uint8Array(await file.arrayBuffer()))
            setStatement(statements)
          } catch (error) {
            console.error(error)
          }
        }
      } else if (file.name.endsWith(".vmd")) {
        if (mplCompiler) {
          try {
            const statements = mplCompiler.reverse_compile("vmd", new Uint8Array(await file.arrayBuffer()))
            setStatement(statements)
          } catch (error) {
            console.error(error)
          }
        }
      } else if (
        file.name.endsWith(".png") ||
        file.name.endsWith(".jpg") ||
        file.name.endsWith(".jpeg") ||
        file.name.endsWith(".webp")
      ) {
        const image = new window.Image()
        image.src = URL.createObjectURL(file)
        image.onload = async () => {
          imageRef.current = image
          const vpdBlob = await detectLandmarks()
          if (vpdBlob && mplCompiler) {
            try {
              const statements = mplCompiler.reverse_compile("vpd", new Uint8Array(await vpdBlob.arrayBuffer()))
              setStatement(statements)
            } catch (error) {
              console.error(error)
            }
          }
        }
        event.target.value = ""
      }
    },
    [setStatement, mplCompiler, detectLandmarks]
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
        const vmdBlob = new Blob([new Uint8Array(vmdBytes)], { type: "application/octet-stream" })
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
          <h3 className="scroll-m-20 text-lg font-semibold tracking-tight hidden md:block">MPL Editor</h3>
        </Link>
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight md:hidden">MPL Editor</h3>
        <div className="flex flex-row gap-2">
          <div className="relative hidden md:block">
            <input
              type="file"
              accept=".vpd,.vmd,.png,.jpg,.jpeg,.webp"
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
              <span className="text-xs">Upload Image/VPD/VMD</span>
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

          <Dialog
            onOpenChange={(open) => {
              if (!open && isPublished) {
                resetSuccessState()
              }
            }}
          >
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
                    {isPublished
                      ? "Your pose has been successfully published to the gallery."
                      : "Publish your pose to the gallery."}
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
