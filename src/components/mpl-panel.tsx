import { SetStateAction, Dispatch, useCallback, useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Import, RefreshCw, X } from "lucide-react"
import CodeEditor from "./code-editor"
import Link from "next/link"
import { Input } from "./ui/input"
import { MPLBoneFrame } from "mmd-mpl"
import { useMPLCompiler } from "@/hooks/useMPLCompiler"

export default function MPLPanel({
  open,
  setOpen,
  mplStatement,
  setMplStatement,
  loadVMD,
  loadVPD,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  mplStatement: string
  setMplStatement: Dispatch<SetStateAction<string>>
  loadVMD: (vmdUrl: string) => void
  loadVPD: (url: string) => Promise<MPLBoneFrame[] | null>
}) {
  const mplCompiler = useMPLCompiler()
  const [description, setDescription] = useState("")

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.name.endsWith(".vpd")) {
        const url = URL.createObjectURL(file)
        const boneStates = await loadVPD(url)
        if (boneStates && mplCompiler) {
          const statements = mplCompiler.reverse_compile("vpd_pose", boneStates)
          setMplStatement(statements)
        }
      }

      event.target.value = ""
    },
    [setMplStatement, loadVPD, mplCompiler]
  )

  const exportMPLScript = useCallback(
    (description: string) => {
      const script: { description: string; mpl: string } = {
        description: description,
        mpl: mplStatement,
      }
      const blob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${description.trim().replace(/\s+/g, "-").replace(/:/g, "-")}.mpl.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [mplStatement]
  )

  const resetPose = useCallback(() => {
    setMplStatement("")
    loadVMD("")
  }, [setMplStatement, loadVMD])

  useEffect(() => {
    if (mplStatement === "") {
      resetPose()
      return
    }

    if (mplCompiler) {
      try {
        const vmdBytes = mplCompiler.compile(mplStatement)
        if (vmdBytes.length === 0) {
          loadVMD("")
          return
        }
        const vmdBlob = new Blob([vmdBytes], { type: "application/octet-stream" })
        const vmdUrl = URL.createObjectURL(vmdBlob)
        loadVMD(vmdUrl)

        return () => {
          URL.revokeObjectURL(vmdUrl)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }, [mplStatement, mplCompiler, loadVMD, resetPose])

  return (
    <div
      className={`fixed right-0 top-0 h-full w-100 bg-background border-l shadow-lg z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col gap-1.5 p-4 border-b">
        <div className="flex items-center justify-between">
          <h4 className="scroll-m-20 text-base font-semibold tracking-tight">
            <Link href="https://github.com/AmyangXYZ/MPL" target="_blank" className="underline">
              MPL
            </Link>{" "}
            Editor
          </h4>
          <div className="flex flex-row gap-0 justify-end items-center">
            <div className="relative mr-1">
              <input
                type="file"
                accept=".vpd,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="pose-upload"
              />
              <Button
                onClick={() => {
                  setMplStatement("")
                }}
                className="flex"
                size="sm"
              >
                <Import className="size-4" />
                <span className="text-xs">Import VPD</span>
              </Button>
            </div>

            <Button
              onClick={() => {
                setMplStatement("")
                resetPose()
              }}
              size="icon"
              variant="ghost"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 pt-4 px-4">
        <CodeEditor value={mplStatement} onChange={setMplStatement} />
      </div>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <Input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={() => exportMPLScript(description)} disabled={!description}>
          Export MPL Script
        </Button>
      </div>
    </div>
  )
}
