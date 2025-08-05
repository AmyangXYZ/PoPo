"use client"

import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  CreateScreenshotAsync,
  DirectionalLight,
  Engine,
  HemisphericLight,
  LoadAssetContainerAsync,
  Material,
  Mesh,
  RegisterSceneLoaderPlugin,
  Scene,
  Vector3,
} from "@babylonjs/core"
import { useRef, useEffect, useCallback, useState } from "react"
import {
  MmdWasmModel,
  SdefInjector,
  MmdWasmInstanceTypeMPR,
  GetMmdWasmInstance,
  MmdWasmRuntime,
  MmdWasmPhysics,
  type IMmdWasmInstance,
  MmdStandardMaterialBuilder,
  MmdStandardMaterial,
  VpdLoader,
  BpmxLoader,
  VmdLoader,
} from "babylon-mmd"

import { MPLBoneFrame, Quaternion as MPLQuaternion, Vector3 as MPLVector3 } from "mmd-mpl"
import { useMPLCompiler } from "@/hooks/useMPLCompiler"
import { Button } from "./ui/button"
import { Upload } from "lucide-react"
import { Input } from "./ui/input"
import Image from "next/image"
import { ScrollArea } from "./ui/scroll-area"

interface Data {
  vpd: string
  description: string
  mpl: string
  image: string
}

export default function LabelingScene() {
  const mplCompiler = useMPLCompiler()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine>(null)
  const sceneRef = useRef<Scene>(null)
  const cameraRef = useRef<Camera>(null)
  const mmdWasmInstanceRef = useRef<IMmdWasmInstance>(null)
  const mmdRuntimeRef = useRef<MmdWasmRuntime>(null)
  const mmdMaterialBuilderRef = useRef<MmdStandardMaterialBuilder>(null)
  const vpdLoaderRef = useRef<VpdLoader>(null)
  const vmdLoaderRef = useRef<VmdLoader>(null)
  const modelRef = useRef<MmdWasmModel>(null)

  const [start, setStart] = useState<number>(1)
  const [end, setEnd] = useState<number>(2000)

  const [currentVpd, setCurrentVpd] = useState<string>("")

  const modelNameRef = useRef(localStorage.getItem("selectedModel") || "深空之眼-梵天")
  const lastVMDUrlRef = useRef("")

  const [loadedData, setLoadedData] = useState<Data[]>([])

  const dataRef = useRef<Data[]>([])


  const [modelLoaded, setModelLoaded] = useState(false)

  const loadVMD = useCallback(
    async (vmdUrl: string) => {
      if (!vmdLoaderRef.current || !modelRef.current || !mplCompiler) return null
      lastVMDUrlRef.current = vmdUrl
      if (vmdUrl === "") {
        modelRef.current.removeAnimation(0)
        return
      }
      const vmd = await vmdLoaderRef.current.loadAsync("vmd_animation", vmdUrl)
      modelRef.current.addAnimation(vmd)
      modelRef.current.setAnimation("vmd_animation")
      mmdRuntimeRef.current!.seekAnimation(0, true)
      mmdRuntimeRef.current!.playAnimation()
    },
    [vmdLoaderRef, modelRef, mplCompiler]
  )

  const loadModel = useCallback(async (): Promise<void> => {
    if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current || !modelNameRef.current) return
    if (modelRef.current) {
      mmdRuntimeRef.current.destroyMmdModel(modelRef.current)
      modelRef.current.mesh.dispose()
    }

    LoadAssetContainerAsync(`/models/${modelNameRef.current}.bpmx`, sceneRef.current!, {
      pluginOptions: {
        mmdmodel: {
          materialBuilder: mmdMaterialBuilderRef.current || undefined,
        },
      },
    }).then(async (result) => {
      const mesh = result.meshes[0]
      modelRef.current = mmdRuntimeRef.current!.createMmdModel(mesh as Mesh, {
        buildPhysics: {
          disableOffsetForConstraintFrame: true,
        },
      })

      result.addAllToScene()
      setModelLoaded(true)

      if (lastVMDUrlRef.current !== "") {
        loadVMD(lastVMDUrlRef.current)
      }
    })
  }, [loadVMD])

  const loadVPD = useCallback(
    async (vpdUrl: string): Promise<MPLBoneFrame[] | null> => {
      if (!vpdLoaderRef.current || !modelRef.current || !mplCompiler) return null

      const vpd = await vpdLoaderRef.current.loadAsync("vpd_pose", vpdUrl)
      // modelRef.current.addAnimation(vpd)
      // modelRef.current.setAnimation("vpd_pose")
      // modelRef.current.currentAnimation?.animate(0)
      const boneStates: MPLBoneFrame[] = []
      for (const boneTrack of vpd.boneTracks) {
        const boneNameJp = boneTrack.name
        const boneNameEn = mplCompiler.get_bone_english_name(boneNameJp)
        if (!boneNameEn) {
          continue
        }

        const rotation = boneTrack.rotations
        if (rotation.length === 0) continue

        if (!(rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0 && rotation[3] === 1)) {
          boneStates.push(
            new MPLBoneFrame(
              boneNameEn,
              boneNameJp,
              new MPLVector3(0, 0, 0),
              new MPLQuaternion(rotation[0], rotation[1], rotation[2], rotation[3])
            )
          )
        }
      }

      for (const boneTrack of vpd.movableBoneTracks) {
        const boneNameJp = boneTrack.name
        const boneNameEn = mplCompiler.get_bone_english_name(boneNameJp)
        if (!boneNameEn) {
          continue
        }
        let position = new MPLVector3(0, 0, 0)
        let rotation = new MPLQuaternion(0, 0, 0, 1)
        if (boneTrack.positions && boneTrack.positions.length > 0) {
          position = new MPLVector3(boneTrack.positions[0], boneTrack.positions[1], boneTrack.positions[2])
        }

        if (boneTrack.rotations && boneTrack.rotations.length > 0) {
          rotation = new MPLQuaternion(
            boneTrack.rotations[0],
            boneTrack.rotations[1],
            boneTrack.rotations[2],
            boneTrack.rotations[3]
          )
        }
        boneStates.push(new MPLBoneFrame(boneNameEn, boneNameJp, position, rotation))
      }
      return boneStates
    },
    [vpdLoaderRef, modelRef, mplCompiler]
  )

  useEffect(() => {
    const resize = () => {
      if (sceneRef.current) {
        sceneRef.current.getEngine().resize()
      }
    }

    const init = async () => {
      if (!canvasRef.current || !mplCompiler) return

      // Register the PMX loader plugin
      RegisterSceneLoaderPlugin(new BpmxLoader())

      const engine = new Engine(canvasRef.current, true, {}, true)
      SdefInjector.OverrideEngineCreateEffect(engine)

      const scene = new Scene(engine)

      scene.clearColor = new Color4(1, 1, 1, 1)

      engineRef.current = engine
      sceneRef.current = scene

      const camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 45, new Vector3(0, 12, 0), scene)
      camera.setPosition(new Vector3(0, 20, -30))
      camera.attachControl(canvasRef.current, false)
      camera.inertia = 0.8
      camera.speed = 10
      camera.radius = 40
      cameraRef.current = camera

      scene.activeCameras = [camera]

      const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene)
      hemisphericLight.intensity = 0.5
      hemisphericLight.specular = new Color3(0, 0, 0)
      hemisphericLight.groundColor = new Color3(1, 1, 1)

      const directionalLight = new DirectionalLight("directionalLight", new Vector3(0.5, -1, 1), scene)
      directionalLight.intensity = 0.5
      directionalLight.autoCalcShadowZBounds = false
      directionalLight.autoUpdateExtends = false
      directionalLight.shadowMaxZ = 20 * 3
      directionalLight.shadowMinZ = -30
      directionalLight.orthoTop = 18 * 3
      directionalLight.orthoBottom = -1 * 3
      directionalLight.orthoLeft = -10 * 3
      directionalLight.orthoRight = 10 * 3
      directionalLight.shadowOrthoScale = 0

      mmdWasmInstanceRef.current = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR())
      const mmdRuntime = new MmdWasmRuntime(mmdWasmInstanceRef.current, scene, new MmdWasmPhysics(scene))
      mmdRuntime.register(scene)
      mmdRuntimeRef.current = mmdRuntime



      const materialBuilder = new MmdStandardMaterialBuilder()
      //   materialBuilder.loadOutlineRenderingProperties = (): void => {
      //     /* do nothing */
      //   }
      materialBuilder.afterBuildSingleMaterial = (material: MmdStandardMaterial): void => {
        material.forceDepthWrite = true
        material.useAlphaFromDiffuseTexture = true
        material.specularColor = new Color3(0, 0, 0)
        if (material.diffuseTexture !== null) material.diffuseTexture.hasAlpha = true

        if (material.transparencyMode === Material.MATERIAL_ALPHABLEND) {
          material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND
          material.alphaCutOff = 0.01
        }
      }
      mmdMaterialBuilderRef.current = materialBuilder

      vpdLoaderRef.current = new VpdLoader(scene)
      vmdLoaderRef.current = new VmdLoader(scene)

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
  }, [loadModel, mplCompiler])

  const takeScreenshot = useCallback(async (): Promise<string> => {
    if (!canvasRef.current || !engineRef.current || !cameraRef.current) return ""

    const b64 = await CreateScreenshotAsync(
      engineRef.current!,
      cameraRef.current!,
      { precision: 1 },
      'image/webp',
      0.8
    )

    return b64
  }, [canvasRef])

  const generateData = useCallback(async (url: string): Promise<Data | null> => {
    if (!mplCompiler || !modelLoaded) return null
    const boneStates = await loadVPD(url)
    if (!boneStates) {
      return null
    }
    const statements = mplCompiler.reverse_compile("vpd_pose", boneStates)
    const vmdBytes = mplCompiler.compile(statements)
    if (vmdBytes.length === 0) {
      loadVMD("")
      return null
    }

    const vmdBlob = new Blob([vmdBytes], { type: "application/octet-stream" })
    const vmdUrl = URL.createObjectURL(vmdBlob)
    await loadVMD(vmdUrl)
    const b64 = await takeScreenshot()
    URL.revokeObjectURL(vmdUrl)
    return {
      vpd: url,
      description: "",
      mpl: statements,
      image: b64
    }
  }, [mplCompiler, modelLoaded, loadVPD, loadVMD, takeScreenshot])

  const loadVpds = useCallback(async () => {
    if (modelLoaded && mplCompiler) {
      console.log("Loading VPDs")
      for (let i = start; i <= end; i++) {
        setCurrentVpd(`${i}.vpd`)
        const data = await generateData(`/vpd/${i}.vpd`)
        if (data) {
          dataRef.current.push(data)
        }
      }
      const json = JSON.stringify(dataRef.current)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pose_data_${start}_${end}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [modelLoaded, mplCompiler, generateData, start, end])


  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.name.endsWith(".json")) {
        const text = await file.text()
        const data = JSON.parse(text) as Data[]
        setLoadedData(data)
      }

      event.target.value = ""
    },
    []
  )


  return (
    <div className="w-full h-full flex flex-row gap-4">
      <div className="flex flex-col justify-center items-center w-[400px] mx-auto z-10 gap-2">
        <div className="text-center">{currentVpd}</div>
        <canvas ref={canvasRef} className="w-full h-[600px] mx-auto z-1 outline-none" />
        <div className="flex flex-row items-center justify-between gap-2">
          <Input type="number" value={start} onChange={(e) => setStart(Number(e.target.value))} />
          <Input type="number" value={end} onChange={(e) => setEnd(Number(e.target.value))} />
          <Button onClick={loadVpds} size="sm" className="flex cursor-pointer">Load VPDs</Button>
        </div>
      </div>
      <div className="flex flex-col max-w-7xl w-full mx-auto py-16">
        <div className="relative hidden md:block">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="pose-upload"
          />
          <Button
            onClick={() => {
            }}
            className="flex cursor-pointer"
            size="sm"
          >
            <Upload className="size-4" />
            <span className="text-xs">Upload JSON</span>
          </Button>
        </div>

        {loadedData.length > 0 && (
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
              {loadedData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2 p-2 border rounded-lg bg-white shadow-sm">
                  <Image
                    src={data.image}
                    alt={data.vpd}
                    width={160}
                    height={160}
                    className="rounded-md object-cover"
                  />
                  <div className="text-xs text-center text-gray-600 truncate w-full">
                    {data.vpd}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

    </div >
  )
}
