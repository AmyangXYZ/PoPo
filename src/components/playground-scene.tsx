"use client"

import { useRef, useEffect, useCallback, useState } from "react"

import MPLEditor from "./mpl-editor"
import { Pose } from "@/lib/database"
import { Engine } from "reze-engine"

export default function PlaygroundScene({ pose }: { pose: Pose | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  const loadVMD = useCallback(async (url: string) => {
    await engineRef.current?.loadAnimation(url)
    engineRef.current?.playAnimation()
  }, [])

  const initEngine = useCallback(async () => {
    if (canvasRef.current) {
      // Initialize engine
      try {
        const engine = new Engine(canvasRef.current, {})
        engineRef.current = engine
        await engine.init()
        await engine.loadModel("/models/深空之眼-梵天/深空之眼-梵天-short-hair-noik.pmx")

        engine.runRenderLoop(() => { })
        setTimeout(() => setModelLoaded(true), 200)
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
    <div className="w-full h-full flex flex-col md:flex-row">
      <div className="w-full h-[70%] md:w-1/2 md:h-full order-1 md:order-2 bg-[#fc70a8] relative">
        {engineError && (
          <div className="text-red-500 z-10 absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg font-medium">
            {engineError}
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full z-1" />
      </div>
      <div className="w-full h-[30%] md:w-1/2 md:h-full order-2 md:order-1 border-t">
        <MPLEditor modelLoaded={modelLoaded} loadVMD={loadVMD} pose={pose} />
      </div>
    </div>
  )
}
