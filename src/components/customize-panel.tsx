import { Pose, MorphsTranslations, RotatableBonesTranslations, MovableBonesTranslations } from "@/lib/pose"
import { Button } from "./ui/button"
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "./ui/accordion"
import { Import, RefreshCw, X } from "lucide-react"
import { Slider } from "./ui/slider"
import { ScrollArea } from "./ui/scroll-area"
import { useState, useCallback, SetStateAction, Dispatch } from "react"
import { Input } from "./ui/input"

export default function CustomizePanel({
  open,
  setOpen,
  pose,
  setPose,
  loadVpd,
  setSmoothUpdate,
  resetPose,
  exportPose,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  pose: Pose
  setPose: Dispatch<SetStateAction<Pose>>
  loadVpd: (vpdUrl: string) => void
  setSmoothUpdate: (smoothUpdate: boolean) => void
  resetPose: () => void
  exportPose: (description: string) => void
}) {
  const [description, setDescription] = useState("")

  const updateMorph = useCallback(
    (morph: string, value: number) => {
      setPose((prev: Pose) => ({
        ...prev,
        face: { ...prev.face, [morph]: value },
      }))
    },
    [setPose]
  )

  const updateBoneRotation = useCallback(
    (boneName: string, componentIndex: number, value: number) => {
      setSmoothUpdate(false)
      setPose((prev: Pose) => {
        const currentRotation = [...prev.rotatableBones[boneName as keyof typeof prev.rotatableBones]]
        currentRotation[componentIndex] = value

        // Normalize quaternion
        const [x, y, z, w] = currentRotation
        const magnitude = Math.sqrt(x * x + y * y + z * z + w * w)
        const normalizedQuat: [number, number, number, number] =
          magnitude > 0 ? [x / magnitude, y / magnitude, z / magnitude, w / magnitude] : [0, 0, 0, 1]

        return {
          ...prev,
          rotatableBones: {
            ...prev.rotatableBones,
            [boneName]: normalizedQuat,
          },
        }
      })
    },
    [setPose, setSmoothUpdate]
  )

  const updateBonePosition = useCallback(
    (boneName: string, componentIndex: number, value: number) => {
      setSmoothUpdate(false)
      setPose((prev: Pose) => {
        const currentPosition = [...prev.movableBones[boneName as keyof typeof prev.movableBones]]
        currentPosition[componentIndex] = value
        return {
          ...prev,
          movableBones: { ...prev.movableBones, [boneName]: currentPosition },
        }
      })
    },
    [setPose, setSmoothUpdate]
  )

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.name.endsWith(".json")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const poseData = JSON.parse(e.target?.result as string)
            setDescription(poseData.description)
            setSmoothUpdate(true)
            setPose((prev: Pose) => ({
              ...prev,
              description: poseData.description || prev.description,
              face: { ...prev.face, ...poseData.face },
              movableBones: { ...prev.movableBones, ...poseData.movableBones },
              rotatableBones: { ...prev.rotatableBones, ...poseData.rotatableBones },
            }))
          } catch (error) {
            console.error("Error parsing JSON file:", error)
            alert("Invalid JSON file. Please select a valid pose file.")
          }
        }
        reader.readAsText(file)
      } else if (file.name.endsWith(".vpd")) {
        const url = URL.createObjectURL(file)
        loadVpd(url)
      }

      event.target.value = ""
    },
    [setPose, setSmoothUpdate, loadVpd]
  )

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col  transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"
        }`}
    >
      <div className="flex flex-col gap-1.5 p-4 border-b">
        <div className="flex items-center justify-between">
          <h4 className="scroll-m-20 text-base font-semibold tracking-tight">Customization</h4>
          <div className="flex items-center justify-end">
            <div className="relative mr-1">
              <input
                type="file"
                accept=".json, .vpd"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="pose-upload"
              />
              <Button onClick={resetPose} className="flex" size="sm">
                <Import className="size-4" />
                <span className="text-xs">Import</span>
              </Button>
            </div>

            <Button size="icon" variant="ghost" onClick={resetPose}>
              <RefreshCw className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" className="px-4 flex-1 flex flex-col overflow-hidden" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Face</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-[calc(100dvh-22rem)] overflow-auto">
              {Object.keys(RotatableBonesTranslations)
                .filter((bone) => bone === "左目" || bone === "右目")
                .map((bone) => (
                  <div key={bone} className="pb-2 pr-6">
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
                          value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                          onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                        />
                        <p className="text-xs w-12 text-right">
                          {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
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
                    onValueChange={(value: number[]) => updateMorph(morph, value[0])}
                  />
                  <p className="text-xs w-10 text-right">{pose.face[morph as keyof typeof pose.face]}</p>
                </div>
              ))}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Movable Bones</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-[calc(100dvh-22rem)] overflow-auto">
              {Object.keys(MovableBonesTranslations).map((bone) => (
                <div key={bone} className="pb-3 pr-6">
                  <div className="text-xs mb-2">
                    <p className="font-medium">{bone}</p>
                    <p className="font-medium text-muted-foreground">
                      {MovableBonesTranslations[bone as keyof typeof MovableBonesTranslations] || bone}
                    </p>
                  </div>
                  {(["X", "Y", "Z"] as const).map((axis, index) => (
                    <div key={axis} className="flex items-center gap-2 mb-1">
                      <p className="text-xs w-4 text-muted-foreground">{axis}</p>
                      <Slider
                        min={-25}
                        max={25}
                        step={0.01}
                        value={[pose.movableBones[bone as keyof typeof pose.movableBones]?.[index] || 0]}
                        onValueChange={(value: number[]) => updateBonePosition(bone, index, value[0])}
                      />
                      <p className="text-xs w-12 text-right">
                        {pose.movableBones[bone as keyof typeof pose.movableBones]?.[index]?.toFixed(2) || 0}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Rotatable Bones</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-[calc(100dvh-22rem)] overflow-auto">
              <Accordion type="single" className="px-4 flex-1 overflow-hidden" collapsible>
                <AccordionItem value="item-1" className="my-0">
                  <AccordionTrigger>Body</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) => ["全ての親", "センター", "上半身", "下半身", "腰"].includes(bone))
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="my-0">
                  <AccordionTrigger>Head</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) => ["首", "頭"].includes(bone))
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Legs</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) => ["左足", "右足", "左足首", "右足首"].includes(bone))
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Arms</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) => ["左肩", "右肩", "左腕", "右腕", "左ひじ", "右ひじ", "左手首", "右手首"].includes(bone))
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Left Hand</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) =>
                        [
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
                        ].includes(bone)
                      )
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Right Hand</AccordionTrigger>
                  <AccordionContent>
                    {Object.keys(RotatableBonesTranslations)
                      .filter((bone) =>
                        [
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
                        ].includes(bone)
                      )
                      .map((bone) => (
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
                                value={[pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index] || 0]}
                                onValueChange={(value: number[]) => updateBoneRotation(bone, index, value[0])}
                              />
                              <p className="text-xs w-12 text-right">
                                {pose.rotatableBones[bone as keyof typeof pose.rotatableBones]?.[index]?.toFixed(2) ||
                                  0}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </AccordionContent>
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
        <Button onClick={() => exportPose(description)} disabled={!description}>
          Export
        </Button>
      </div>
    </div>
  )
}
