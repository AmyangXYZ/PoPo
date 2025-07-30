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

export default function MPLEditor({
  loadVPD,
  modelLoaded,
  loadVMD,
}: {
  loadVPD: (url: string) => Promise<MPLBoneFrame[] | null>
  loadVMD: (url: string) => void
  modelLoaded: boolean
}) {
  const mplCompiler = useMPLCompiler()
  const [vmdUrl, setVmdUrl] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [poseName, setPoseName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingError, setUploadingError] = useState<string | null>(null)
  const { isSignedIn } = useUser()

  const [statement, setStatement] = useState(`@pose welcome {
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
        console.error(error)
      }
    }
  }, [statement, modelLoaded, mplCompiler, loadVMD])

  // Clean up preview image URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage])

  const handlePreviewImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSignedIn) {
        alert("Please login to upload a preview image")
        return
      }

      const file = event.target.files?.[0]
      if (!file) return

      setIsUploading(true)

      // Create a preview URL for display
      const previewUrl = URL.createObjectURL(file)
      setPreviewImage(previewUrl)

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setPreviewImageUrl(data.url)
        } else {
          console.error("Failed to upload image")
          setPreviewImage(null)
        }
      } catch (error) {
        console.error("Failed to upload image: " + error)
        setUploadingError("Failed to upload image: " + error)
        setPreviewImage(null)
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
      alert("Please upload a preview image first")
      return
    }

    if (!poseName.trim()) {
      alert("Please enter a pose name")
      return
    }

    const response = await fetch("/api/pose-publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mpl: statement,
        name: poseName.trim(),
        preview_url: previewImageUrl,
        author: "Anonymous",
      }),
    })
    const data = await response.json()
    console.log(data.id)
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

          <Dialog>
            <form onSubmit={(e) => e.preventDefault()}>
              <DialogTrigger asChild>
                <Button className="flex cursor-pointer" size="sm" disabled={!vmdUrl}>
                  <CloudCheck className="size-4" />
                  <span className="text-xs">Publish</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Publish Pose</DialogTitle>
                  <DialogDescription>Publish your pose to the gallery.</DialogDescription>
                </DialogHeader>
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
                      {uploadingError && <p className="text-red-500">{uploadingError}</p>}
                    </div>
                    {previewImage && (
                      <div className="mt-2">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={publishPose}>
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 py-2 px-6">
        <CodeEditor value={statement} onChange={setStatement} />
      </div>
    </div>
  )
}
