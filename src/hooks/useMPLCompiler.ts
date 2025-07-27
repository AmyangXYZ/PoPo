import { WasmMPLCompiler } from "mmd-mpl"
import { useState, useEffect } from "react"

export function useMPLCompiler() {
  const [compiler, setCompiler] = useState<WasmMPLCompiler | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { default: init, WasmMPLCompiler } = await import("mmd-mpl")
      await init()
      if (!cancelled) setCompiler(new WasmMPLCompiler())
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return compiler // null until ready
}
