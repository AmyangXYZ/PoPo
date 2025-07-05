import { Button } from "./ui/button"
import { X } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import { SetStateAction, Dispatch } from "react"
import { Mesh } from "@babylonjs/core/Meshes/mesh"
import { Switch } from "./ui/switch"

const clothes = ["衣边", "衣服", "袖子", "头饰", "脖环", "脖带", "鞋子", "眼镜"]

export default function ClothesPanel({
  open,
  setOpen,
  meshes,
  setMeshes,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  meshes: Mesh[]
  setMeshes: Dispatch<SetStateAction<Mesh[]>>
}) {
  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col  transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col gap-1.5 p-4 border-b">
        <div className="flex items-center justify-between">
          <h4 className="scroll-m-20 text-base font-semibold tracking-tight">Clothes</h4>
          <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[calc(100dvh-22rem)] overflow-auto p-4 ">
        {meshes
          .filter((mesh) => clothes.includes(mesh.name))
          .map((mesh) => (
            <div key={mesh.name} className="flex items-center gap-2 pb-1 pr-6">
              <div className="text-xs w-44">
                <p className="font-medium">{mesh.name}</p>
              </div>
              <Switch
                checked={mesh.isEnabled() || false}
                onCheckedChange={(checked) => {
                  mesh.setEnabled(checked)
                  setMeshes((prev) => prev.map((m) => (m.name === mesh.name ? mesh : m)))
                }}
              />
            </div>
          ))}
      </ScrollArea>
    </div>
  )
}
