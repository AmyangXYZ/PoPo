import {
  KeyMorphs,
  MovableBones,
  Morphs,
  Pose,
  RotatableBones,
  MorphsTranslations,
  RotatableBonesTranslations,
} from "@/lib/pose"
import { Button } from "./ui/button"
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "./ui/accordion"
import { RefreshCw, X } from "lucide-react"
import { Slider } from "./ui/slider"
import { ScrollArea } from "./ui/scroll-area"
import { useEffect, useRef, useState, useCallback } from "react"
import { Input } from "./ui/input"

export default function CustomizePanel({
  open,
  setOpen,
  pose,
  setPose,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  pose: Pose
  setPose: (pose: Pose) => void
}) {
  const [description, setDescription] = useState("")
  const descriptionRef = useRef<string>("")

  useEffect(() => {
    descriptionRef.current = description
  }, [description])

  // Memoized bone update function
  const updateBoneRotation = useCallback(
    (boneName: string, componentIndex: number, value: number) => {
      const currentRotation = [...pose.rotatableBones[boneName as keyof typeof pose.rotatableBones]]
      currentRotation[componentIndex] = value

      // Normalize quaternion
      const [x, y, z, w] = currentRotation
      const magnitude = Math.sqrt(x * x + y * y + z * z + w * w)
      const normalizedQuat: [number, number, number, number] =
        magnitude > 0 ? [x / magnitude, y / magnitude, z / magnitude, w / magnitude] : [0, 0, 0, 1]

      setPose({
        ...pose,
        rotatableBones: {
          ...pose.rotatableBones,
          [boneName]: normalizedQuat,
        },
      })
    },
    [pose, setPose]
  )

  const resetPose = () => {
    const defaultPose = JSON.parse(JSON.stringify(pose))
    for (const morph of KeyMorphs) {
      defaultPose.face[morph as keyof typeof defaultPose.face] = 0
    }
    for (const bone of Object.keys(pose.rotatableBones)) {
      defaultPose.rotatableBones[bone as keyof typeof defaultPose.rotatableBones] = [0, 0, 0, 1]
    }
    setPose(defaultPose)
  }

  const exportPose = () => {
    const poseJson = {
      description: descriptionRef.current,
      face: {} as Morphs,
      movableBones: {} as MovableBones,
      rotatableBones: {} as RotatableBones,
    }
    for (const morph of KeyMorphs) {
      if (pose.face[morph as keyof typeof pose.face] !== 0) {
        poseJson.face[morph as keyof typeof poseJson.face] = pose.face[morph as keyof typeof pose.face]
      }
    }
    for (const bone of Object.keys(pose.rotatableBones)) {
      const rotation = pose.rotatableBones[bone as keyof typeof pose.rotatableBones]
      if (JSON.stringify(rotation) !== JSON.stringify([0, 0, 0, 1])) {
        poseJson.rotatableBones[bone as keyof typeof poseJson.rotatableBones] = rotation
      }
    }
    for (const bone of Object.keys(pose.movableBones)) {
      const position = pose.movableBones[bone as keyof typeof pose.movableBones]
      if (JSON.stringify(position) !== JSON.stringify([0, 0, 0])) {
        poseJson.movableBones[bone as keyof typeof poseJson.movableBones] = position
      }
    }

    const blob = new Blob([JSON.stringify(poseJson, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pose_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col  transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col gap-1.5 p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Customization</h2>
          <div className="flex items-center justify-end">
            <Button size="icon" variant="ghost" onClick={resetPose} className="h-6 w-6">
              <RefreshCw className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="h-6 w-6">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" className="px-4 flex-1 overflow-hidden" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Face</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-200">
              {Object.keys(MorphsTranslations).map((morph) => (
                <div key={morph} className="flex items-center gap-2 pb-1 pr-6">
                  <div className="text-xs w-44">
                    <p className="font-medium">{morph}</p>
                    <p className="font-medium text-muted-foreground">
                      {MorphsTranslations[morph as keyof typeof MorphsTranslations] || morph}
                    </p>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[pose.face[morph as keyof typeof pose.face]]}
                    onValueChange={(value: number[]) => setPose({ ...pose, face: { ...pose.face, [morph]: value[0] } })}
                  />
                  <p className="text-xs w-10 text-right">{pose.face[morph as keyof typeof pose.face]}</p>
                </div>
              ))}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Rotatable Bones</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-200">
              {Object.keys(RotatableBonesTranslations).map((bone) => (
                <div key={bone} className="pb-3 pr-6">
                  <div className="text-xs mb-2">
                    <p className="font-medium">{bone}</p>
                    <p className="font-medium text-muted-foreground">
                      {RotatableBonesTranslations[bone as keyof typeof RotatableBonesTranslations] || bone}
                    </p>
                  </div>
                  {(["X", "Y", "Z", "W"] as const).map((axis, index) => (
                    <div key={axis} className="flex items-center gap-2 mb-1">
                      <p className="text-xs w-4 text-muted-foreground">{axis}</p>
                      <Slider
                        min={-1}
                        max={1}
                        step={0.01}
                        value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones][index]]}
                        onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                      />
                      <p className="text-xs w-12 text-right">
                        {pose.rotatableBones[bone as keyof typeof pose.rotatableBones][index].toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Fingers</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-2 p-4 border-t">
        <Input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={exportPose}>Export</Button>
      </div>
    </div>
  )
}
