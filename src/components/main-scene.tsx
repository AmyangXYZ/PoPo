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
  Quaternion,
  RegisterSceneLoaderPlugin,
  Scene,
  ShadowGenerator,
  Space,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { useRef, useEffect, useCallback, useState } from "react"
import Image from "next/image"
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
  VpdLoader,
  MotionType,
  RigidBodyConstructionInfo,
  RigidBody,
  PhysicsStaticPlaneShape,
} from "babylon-mmd"
import ChatInput from "./chat-input"

import { IMmdRuntimeLinkedBone } from "babylon-mmd/esm/Runtime/IMmdRuntimeLinkedBone"
import { Button } from "./ui/button"
import Link from "next/link"
import { CodeXml, Shirt } from "lucide-react"
import ClothesPanel from "./clothes-panel"
import { MmdWasmPhysicsRuntimeImpl } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysicsRuntimeImpl"
import { BoneRotationQuaternion, BONES, Pose } from "@/lib/mpl"
import MPLPanel from "./mpl-panel"

interface TargetRotation {
  quaternion: Quaternion
  startTime: number
  duration: number
  startQuaternion: Quaternion
}

interface TargetPosition {
  position: Vector3
  startTime: number
  duration: number
  startPosition: Vector3
}

export default function MainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine>(null)
  const sceneRef = useRef<Scene>(null)
  const shadowGeneratorRef = useRef<ShadowGenerator>(null)
  const mmdWasmInstanceRef = useRef<IMmdWasmInstance>(null)
  const mmdRuntimeRef = useRef<MmdWasmRuntime>(null)
  const mmdMaterialBuilderRef = useRef<MmdStandardMaterialBuilder>(null)
  const vpdLoaderRef = useRef<VpdLoader>(null)
  const modelRef = useRef<MmdWasmModel>(null)
  const bonesRef = useRef<{ [key: string]: IMmdRuntimeLinkedBone }>({})
  const targetRotationsRef = useRef<{ [key: string]: TargetRotation }>({})
  const targetPositionsRef = useRef<{ [key: string]: TargetPosition }>({})
  const [pose, setPose] = useState<Pose>({
    description: "",
    morphs: {},
    bones: {},
  })
  const [mplStatement, setMplStatement] = useState("")

  const [meshes, setMeshes] = useState<Mesh[]>([])

  const [openMPLPanel, setOpenMPLPanel] = useState(false)

  const [openClothesPanel, setOpenClothesPanel] = useState(false)

  const getBone = (name: string): IMmdRuntimeLinkedBone | null => {
    return bonesRef.current[name]
  }

  const rotateBone = useCallback((boneName: string, targetQuaternion: Quaternion, duration: number = 1000) => {
    const bone = getBone(boneName)
    if (!bone) {
      console.log("missing in rotating bone", boneName)
      return
    }

    targetRotationsRef.current[boneName] = {
      quaternion: targetQuaternion,
      startTime: performance.now(),
      duration: duration,
      startQuaternion: bone.rotationQuaternion || new Quaternion(),
    }
  }, [])

  const applyPose = useCallback(
    (pose?: Pose) => {
      if (!modelRef.current || !pose) return

      // if (pose.face) {
      //   for (const [morphName, targetValue] of Object.entries(pose.face)) {
      //     modelRef.current.morph.setMorphWeight(morphName, targetValue as number)
      //   }
      // }

      for (const boneNameJp of Object.values(BONES)) {
        const bone = getBone(boneNameJp)
        if (!bone) continue

        const boneRotationQuaternion = pose.bones[boneNameJp] || [0, 0, 0, 1]
        rotateBone(
          boneNameJp,
          new Quaternion(
            boneRotationQuaternion[0],
            boneRotationQuaternion[1],
            boneRotationQuaternion[2],
            boneRotationQuaternion[3]
          )
        )
      }
    },
    [rotateBone]
  )

  const loadModel = useCallback(async (): Promise<void> => {
    if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current) return
    if (modelRef.current) {
      mmdRuntimeRef.current.destroyMmdModel(modelRef.current)
      modelRef.current.mesh.dispose()
    }

    ImportMeshAsync(`/models/深空之眼-梵天/深空之眼-梵天.pmx`, sceneRef.current!, {
      pluginOptions: {
        mmdmodel: {
          materialBuilder: mmdMaterialBuilderRef.current || undefined,
        },
      },
    }).then(async (result) => {
      const mesh = result.meshes[0]
      shadowGeneratorRef.current!.addShadowCaster(mesh)
      modelRef.current = mmdRuntimeRef.current!.createMmdModel(mesh as Mesh, {
        buildPhysics: {
          disableOffsetForConstraintFrame: true,
        },
      })

      for (const bone of modelRef.current!.skeleton.bones) {
        if (Object.values(BONES).includes(bone.name)) {
          bonesRef.current[bone.name] = bone
        }
      }

      const clothes = ["衣边", "衣服", "袖子", "头饰", "脖环", "脖带", "鞋子", "眼镜"]

      setMeshes((prev) => {
        const newMeshes = mesh.metadata.meshes.filter((mesh: Mesh) => clothes.includes(mesh.name))
        if (prev.length === 0) {
          return newMeshes
        }
        for (const m of newMeshes) {
          const prevMesh = prev.find((p) => p.name === m.name)
          if (prevMesh) {
            m.setEnabled(prevMesh.isEnabled())
          }
        }
        return newMeshes
      })
    })
  }, [])

  const loadVpd = useCallback(
    async (vpdUrl: string): Promise<Pose | null> => {
      if (!vpdLoaderRef.current || !modelRef.current) return null

      const vpd = await vpdLoaderRef.current.loadAsync("vpd_pose", vpdUrl)
      // modelRef.current.addAnimation(vpd)
      // modelRef.current.setAnimation("vpd_pose")
      // modelRef.current.currentAnimation?.animate(0)
      const poseVpd = {
        description: "",
        morphs: {},
        bones: {} as { [key: string]: BoneRotationQuaternion },
      }
      for (const boneTrack of vpd.boneTracks) {
        const boneName = boneTrack.name

        if (!Object.values(BONES).includes(boneName)) {
          continue
        }

        const rotations = boneTrack.rotations
        if (rotations.length === 0) continue
        const rotation: BoneRotationQuaternion = [...rotations] as BoneRotationQuaternion

        if (!(rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0 && rotation[3] === 1)) {
          poseVpd.bones[boneName] = rotation
        }
      }

      for (const boneTrack of vpd.movableBoneTracks) {
        const boneName = boneTrack.name
        if (!Object.values(BONES).includes(boneName)) {
          continue
        }

        if (boneTrack.rotations && boneTrack.rotations.length > 0) {
          const rotation: BoneRotationQuaternion = [...boneTrack.rotations] as BoneRotationQuaternion
          poseVpd.bones[boneName] = rotation
        }
      }

      return poseVpd
    },
    [vpdLoaderRef, modelRef]
  )

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

      scene.clearColor = new Color4(0.99, 0.44, 0.66, 1.0)

      engineRef.current = engine
      sceneRef.current = scene

      const camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 45, new Vector3(0, 12, 0), scene)
      camera.setPosition(new Vector3(0, 19, -25))
      camera.attachControl(canvasRef.current, false)
      camera.inertia = 0.8
      camera.speed = 10

      scene.activeCameras = [camera]

      const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene)
      hemisphericLight.intensity = 0.5
      hemisphericLight.specular = new Color3(0, 0, 0)
      hemisphericLight.groundColor = new Color3(1, 1, 1)

      const directionalLight = new DirectionalLight("directionalLight", new Vector3(2, -29.15, 4), scene)
      directionalLight.intensity = 0.9

      const shadowGenerator = new ShadowGenerator(2048, directionalLight)
      shadowGeneratorRef.current = shadowGenerator

      mmdWasmInstanceRef.current = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR())
      const mmdRuntime = new MmdWasmRuntime(mmdWasmInstanceRef.current, scene, new MmdWasmPhysics(scene))
      mmdRuntime.register(scene)
      mmdRuntimeRef.current = mmdRuntime

      const ground = CreateDisc("stageGround", { radius: 12, tessellation: 64 }, scene)
      const groundMaterial = new StandardMaterial("groundMaterial", scene)
      groundMaterial.diffuseColor = new Color3(0.95, 0.98, 1.0)
      groundMaterial.emissiveColor = new Color3(0.1, 0.15, 0.25)
      groundMaterial.specularColor = new Color3(0.2, 0.3, 0.5)
      ground.material = groundMaterial
      ground.rotation.x = Math.PI / 2
      ground.receiveShadows = true

      const physicsRuntime = mmdRuntime.physics!.getImpl(MmdWasmPhysicsRuntimeImpl)
      {
        const info = new RigidBodyConstructionInfo(mmdRuntime.wasmInstance)
        info.motionType = MotionType.Static
        info.shape = new PhysicsStaticPlaneShape(physicsRuntime, new Vector3(0, 0.5, 0), 0)
        const groundBody = new RigidBody(physicsRuntime, info)
        physicsRuntime.addRigidBodyToGlobal(groundBody)
      }

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

      loadModel()

      // Add bone rotation updates to the render loop
      scene.onBeforeRenderObservable.add(() => {
        if (!modelRef.current) return

        const currentTime = performance.now()

        // Update bone rotations
        const rotationBoneNames = Object.keys(targetRotationsRef.current)
        for (const boneName of rotationBoneNames) {
          const targetRotation = targetRotationsRef.current[boneName]
          const bone = getBone(boneName)
          if (!bone) continue

          const elapsed = currentTime - targetRotation.startTime
          const progress = Math.min(elapsed / targetRotation.duration, 1.0)

          if (progress >= 1.0) {
            // Animation complete
            bone.setRotationQuaternion(targetRotation.quaternion, Space.LOCAL)
            delete targetRotationsRef.current[boneName]
          } else {
            // Still animating - use smooth interpolation
            const interpolatedRotation = Quaternion.Slerp(
              targetRotation.startQuaternion,
              targetRotation.quaternion,
              progress
            )
            bone.setRotationQuaternion(interpolatedRotation, Space.LOCAL)
          }
        }

        // Update bone positions
        const positionBoneNames = Object.keys(targetPositionsRef.current)
        for (const boneName of positionBoneNames) {
          const targetPosition = targetPositionsRef.current[boneName]
          const bone = getBone(boneName)
          if (!bone) continue

          const elapsed = currentTime - targetPosition.startTime
          const progress = Math.min(elapsed / targetPosition.duration, 1.0)

          if (progress >= 1.0) {
            // Animation complete
            bone.position = targetPosition.position
            delete targetPositionsRef.current[boneName]
          } else {
            // Still animating - use smooth interpolation
            const interpolatedPosition = Vector3.Lerp(targetPosition.startPosition, targetPosition.position, progress)
            bone.position = interpolatedPosition
          }
        }
      })

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
    if (modelRef.current && pose) {
      applyPose(pose)
    }
  }, [pose, applyPose])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full z-1" />

      <div className="absolute flex justify-between top-2 mx-auto flex px-4 w-full z-20">
        <Button size="icon" asChild className="bg-white text-black size-7 rounded-full hover:bg-gray-200">
          <Link href="https://github.com/AmyangXYZ/PoPo" target="_blank">
            <Image src="/github-mark.svg" alt="GitHub" width={18} height={18} />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {!openClothesPanel && (
            <div className="">
              <Button
                size="icon"
                className="bg-white text-black size-7 rounded-full hover:bg-pink-100 cursor-pointer"
                onClick={() => setOpenClothesPanel(true)}
              >
                <Shirt />
              </Button>
            </div>
          )}
          {!openMPLPanel && (
            <div className="">
              <Button
                size="icon"
                className="bg-white text-black size-7 rounded-full hover:bg-pink-100 cursor-pointer"
                onClick={() => setOpenMPLPanel(true)}
              >
                <CodeXml />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ClothesPanel open={openClothesPanel} setOpen={setOpenClothesPanel} meshes={meshes} setMeshes={setMeshes} />
      <MPLPanel open={openMPLPanel} setOpen={setOpenMPLPanel} setPose={setPose} loadVpd={loadVpd} mplStatement={mplStatement} setMplStatement={setMplStatement} />
      <div
        className={`flex flex-col gap-2 fixed left-1/2 -translate-x-1/2 bottom-0 max-w-2xl mx-auto flex p-4 w-full z-10 ${openMPLPanel || openClothesPanel ? "hidden" : ""
          }`}
      >
        <ChatInput setMplStatement={setMplStatement} />
      </div>
    </div>
  )
}
