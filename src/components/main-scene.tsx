"use client"

import { useRef, useEffect, useCallback, useState } from "react"

import ChatInput from "./chat-input"
import { Engine } from "reze-engine"

export default function MainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const engineRef = useRef<Engine>(null)
  const [engineError, setEngineError] = useState<string | null>(null)

  const loadVMD = useCallback(async (url: string) => {
    await engineRef.current?.loadAnimation(url)
    await new Promise((resolve) => requestAnimationFrame(resolve))
    engineRef.current?.playAnimation()
  }, [])

  const initEngine = useCallback(async () => {
    if (canvasRef.current) {
      // Initialize engine
      try {
        const engine = new Engine(canvasRef.current, {})
        engineRef.current = engine
        await engine.init()
        await engine.loadModel("/models/深空之眼-梵天/深空之眼-梵天-noik.pmx")

        engine.runRenderLoop(() => {})
      } catch (error) {
        setEngineError(error instanceof Error ? error.message : "Unknown error")
      }
    }
  }, [])

  useEffect(() => {
    void (async () => {
      initEngine()
    })()

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose()
      }
    }
  }, [initEngine])

  return (
    <div className="w-full h-full">
      <div className="w-full h-[70%] md:h-full order-1 md:order-2 bg-[#fc70a8] relative">
        {engineError && (
          <div className="text-red-500 z-10 absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg font-medium">
            {engineError}
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full z-1" />
      </div>

      <div className="flex flex-col gap-2 fixed left-1/2 -translate-x-1/2 bottom-0 max-w-2xl mx-auto flex p-4 w-full z-10">
        <ChatInput loadVMD={loadVMD} />
      </div>
    </div>
  )
}
