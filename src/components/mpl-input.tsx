import { VALID_STATEMENTS, MPLInterpreter } from "@/lib/mpl"
import { MovableBones, Pose } from "@/lib/pose"
import { SetStateAction, Dispatch, useCallback, useState, useEffect } from "react"
import { CommandGroup, CommandInput, CommandItem, CommandList, Command } from "./ui/command"

export default function MPLInput({
  setPose,
  setSmoothUpdate,
}: {
  setPose: Dispatch<SetStateAction<Pose>>
  setSmoothUpdate: (smoothUpdate: boolean) => void
}) {
  const [statement, setStatement] = useState("")
  const [showAvailableStatements, setShowAvailableStatements] = useState(false)

  const generatePose = useCallback(
    async (description: string) => {
      const poseData = MPLInterpreter(description)
      if (!poseData) {
        return
      }
      setSmoothUpdate(true)

      setPose((prev) => ({
        ...prev,
        description: poseData.description || prev.description,
        face: { ...prev.face, ...poseData.face },
        movableBones: { ...prev.movableBones, ...poseData.movableBones } as MovableBones,
        rotatableBones: { ...prev.rotatableBones, ...poseData.rotatableBones },
      }))
    },
    [setPose, setSmoothUpdate]
  )

  useEffect(() => {
    generatePose(statement)
  }, [statement, generatePose])

  return (
    <div className="flex flex-col gap-2">
      <Command className="bg-white/70 backdrop-blur-sm shadow-lg">
        {(statement || showAvailableStatements) && (
          <CommandList>
            <CommandGroup>
              {VALID_STATEMENTS.map((stmt: string, index: number) => (
                <CommandItem
                  key={index}
                  value={stmt}
                  onSelect={(currentValue) => {
                    setStatement(currentValue)
                  }}
                >
                  {stmt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
        <CommandInput
          placeholder="Or use our MMD Pose Language - <bone> <action> <direction> <degrees>"
          value={statement}
          onValueChange={(value) => setStatement(value)}
          onFocus={() => {
            setShowAvailableStatements(true)
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowAvailableStatements(false)
            }, 100)
          }}
        />
      </Command>
    </div>
  )
}
