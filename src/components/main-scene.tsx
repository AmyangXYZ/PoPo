"use client"

import {
  ArcRotateCamera,
  Color3,
  Color4,
  CreateDisc,
  DirectionalLight,
  Engine,
  HemisphericLight,
  ImportMeshAsync,
  Material,
  Mesh,
  RegisterSceneLoaderPlugin,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { useRef, useEffect, useCallback, useState } from "react"
import {
  MmdWasmModel,
  PmxLoader,
  SdefInjector,
  MmdWasmInstanceTypeMPR,
  GetMmdWasmInstance,
  MmdWasmRuntime,
  MmdWasmPhysics,
  type IMmdWasmInstance,
  MmdStandardMaterialBuilder,
  MmdStandardMaterial,
} from "babylon-mmd"
import ChatInput from "./chat-input"

export default function MainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine>(null)
  const sceneRef = useRef<Scene>(null)
  const shadowGeneratorRef = useRef<ShadowGenerator>(null)
  const mmdWasmInstanceRef = useRef<IMmdWasmInstance>(null)
  const mmdRuntimeRef = useRef<MmdWasmRuntime>(null)
  const mmdMaterialBuilderRef = useRef<MmdStandardMaterialBuilder>(null)
  const modelRef = useRef<MmdWasmModel>(null)

  const [pose, setPose] = useState<string>("")

  const loadModel = useCallback(async (): Promise<void> => {
    if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current) return
    if (modelRef.current) {
      mmdRuntimeRef.current.destroyMmdModel(modelRef.current)
      modelRef.current.mesh.dispose()
    }

    ImportMeshAsync(`/models/深空之眼-塞勒涅/深空之眼-塞勒涅.pmx`, sceneRef.current!, {
      pluginOptions: {
        mmdmodel: {
          materialBuilder: mmdMaterialBuilderRef.current || undefined,
        },
      },
    }).then((result) => {
      const mesh = result.meshes[0]
      for (const m of mesh.metadata.meshes) {
        m.receiveShadows = true
      }
      shadowGeneratorRef.current!.addShadowCaster(mesh)
      modelRef.current = mmdRuntimeRef.current!.createMmdModel(mesh as Mesh, {
        buildPhysics: {
          disableOffsetForConstraintFrame: true,
        },
      })

      //   const material = modelRef.current!.mesh.metadata.materials.find((m: Material) => m.name === "胸口")
      //   const m = modelRef.current!.mesh.metadata.meshes.find((m: Mesh) => m.name === "胸口")
      //   if (material && m) {
      //     material.alpha = 0.5
      //     m.visibility = 0
      //   }
    })
  }, [])

  useEffect(() => {
    const resize = () => {
      if (sceneRef.current) {
        sceneRef.current.getEngine().resize()
      }
    }

    const init = async () => {
      if (!canvasRef.current) return

      // Register the PMX loader plugin
      RegisterSceneLoaderPlugin(new PmxLoader())

      const engine = new Engine(canvasRef.current, true, {}, true)
      SdefInjector.OverrideEngineCreateEffect(engine)

      const scene = new Scene(engine)
      scene.clearColor = new Color4(0.96, 0.38, 0.54, 1.0)
      scene.ambientColor = new Color3(0.18, 0.12, 0.1)

      engineRef.current = engine
      sceneRef.current = scene

      const camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 45, new Vector3(0, 12, 0), scene)
      camera.setPosition(new Vector3(0, 19, -25))
      camera.attachControl(canvasRef.current, false)
      camera.inertia = 0.8
      camera.speed = 10

      scene.activeCameras = [camera]

      const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene)
      hemisphericLight.intensity = 0.7
      hemisphericLight.specular = new Color3(0, 0, 0)
      hemisphericLight.groundColor = new Color3(1, 1, 1)

      const directionalLight = new DirectionalLight("directionalLight", new Vector3(6, -18, 12), scene)
      directionalLight.intensity = 1

      const shadowGenerator = new ShadowGenerator(2048, directionalLight)
      shadowGenerator.usePercentageCloserFiltering = true
      shadowGenerator.forceBackFacesOnly = true
      shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH
      shadowGeneratorRef.current = shadowGenerator

      mmdWasmInstanceRef.current = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR())
      const mmdRuntime = new MmdWasmRuntime(mmdWasmInstanceRef.current, scene, new MmdWasmPhysics(scene))
      mmdRuntime.register(scene)
      mmdRuntimeRef.current = mmdRuntime

      const ground = CreateDisc("stageGround", { radius: 20, tessellation: 64 }, scene)
      const groundMaterial = new StandardMaterial("groundMaterial", scene)
      groundMaterial.diffuseColor = new Color3(1.02, 1.02, 1.02)
      ground.material = groundMaterial
      ground.rotation.x = Math.PI / 2
      ground.receiveShadows = true

      const materialBuilder = new MmdStandardMaterialBuilder()
      //   materialBuilder.loadOutlineRenderingProperties = (): void => {
      //     /* do nothing */
      //   }
      materialBuilder.afterBuildSingleMaterial = (material: MmdStandardMaterial): void => {
        material.forceDepthWrite = true
        material.useAlphaFromDiffuseTexture = true
        if (material.diffuseTexture !== null) material.diffuseTexture.hasAlpha = true

        if (material.transparencyMode === Material.MATERIAL_ALPHABLEND) {
          material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND
          material.alphaCutOff = 0.01
        }
      }
      mmdMaterialBuilderRef.current = materialBuilder

      loadModel()

      window.addEventListener("resize", resize)

      engine.runRenderLoop(() => {
        scene.render()
      })
    }
    init()

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose()
        window.removeEventListener("resize", resize)
      }
    }
  }, [loadModel])

  useEffect(() => {
    if (pose && modelRef.current) {
      // Test morph targets with dummy values
      const morphTargets = {
        まばたき: 0.1, // Blink (almost fully open)
        ウィンク: 0, // Wink
        ウィンク右: 0, // Wink Right
        ウィンク２: 0, // Wink 2
        笑い: 0.2, // Laughing Eyes
        怒り: 0, // Angry Eyes
        困る: 0, // Troubled/Sad Eyes
        驚き: 0, // Surprised Eyes
        細め: 0.2, // Narrow Eyes

        眉上: 0.4, // Eyebrow Up (adds energy)
        眉下: 0, // Eyebrow Down
        眉怒り: 0, // Angry Eyebrows
        眉困る: 0, // Troubled Eyebrows

        あ: 0.2, // Mouth "A"
        い: 0.1, // Mouth "I"
        う: 0, // Mouth "U"
        え: 0, // Mouth "E"
        お: 0, // Mouth "O"
        にこり: 0, // Smile (main smile)
        真面目: 0, // Serious
        アホ: 0, // Goofy/Stupid
        口角上げ: 0, // Mouth Corners Up (smile accent)
        口角下げ: 1, // Mouth Corners Down

        汗: 0, // Sweat
        涙: 1, // Tears
        びっくり: 0, // Surprised
        ドヤ: 0, // Confident/Smug (a little)
        照れ: 0, // Embarrassed
        目閉じ: 0, // Eyes Closed
      }

      // Apply morph targets
      for (const [morphName, targetValue] of Object.entries(morphTargets)) {
        try {
          modelRef.current.morph.setMorphWeight(morphName, targetValue)
        } catch {
          // Silently ignore if morph doesn't exist
          console.log(`Morph "${morphName}" not found`)
        }
      }
    }
  }, [pose])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 max-w-2xl mx-auto flex p-4 w-full">
        <ChatInput setPose={setPose} />
      </div>
    </div>
  )
}
