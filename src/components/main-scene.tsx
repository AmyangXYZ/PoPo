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
  Matrix,
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
import {
  BonePosition,
  BoneRotationQuaternion,
  Morphs,
  MorphsTranslations,
  MovableBones,
  MovableBonesTranslations,
  Pose,
  RotatableBones,
  RotatableBonesTranslations,
} from "@/lib/pose"
import { IMmdRuntimeLinkedBone } from "babylon-mmd/esm/Runtime/IMmdRuntimeLinkedBone"
import { Button } from "./ui/button"
import Link from "next/link"
import CustomizePanel from "./customize-panel"
import { HandMetal, Shirt } from "lucide-react"
import ClothesPanel from "./clothes-panel"
import { MmdWasmPhysicsRuntimeImpl } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysicsRuntimeImpl"

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
    face: {} as Morphs,
    movableBones: {} as MovableBones,
    rotatableBones: {} as RotatableBones,
  } as Pose)
  const defaultPoseRef = useRef<Pose>(null)
  const [meshes, setMeshes] = useState<Mesh[]>([])

  const [openCustomizePanel, setOpenCustomizePanel] = useState(false)
  const smoothUpdateRef = useRef(true)

  const [openClothesPanel, setOpenClothesPanel] = useState(false)

  const setSmoothUpdate = useCallback((smoothUpdate: boolean) => {
    smoothUpdateRef.current = smoothUpdate
  }, [])

  const getBone = (name: string): IMmdRuntimeLinkedBone | null => {
    return bonesRef.current[name]
  }

  const rotateBone = useCallback((boneName: string, targetQuaternion: Quaternion) => {
    const bone = getBone(boneName)
    if (!bone) return

    bone.setRotationQuaternion(targetQuaternion, Space.LOCAL)
  }, [])

  const moveBone = useCallback((boneName: string, position: BonePosition) => {
    const bone = getBone(boneName)
    if (!bone) return
    bone.position = new Vector3(position[0], position[1], position[2])
  }, [])

  const rotateBoneSmooth = useCallback((boneName: string, targetQuaternion: Quaternion, duration: number = 1000) => {
    const bone = getBone(boneName)
    if (!bone) return

    targetRotationsRef.current[boneName] = {
      quaternion: targetQuaternion,
      startTime: performance.now(),
      duration: duration,
      startQuaternion: bone.rotationQuaternion || new Quaternion(),
    }
  }, [])

  const moveBoneSmooth = useCallback((boneName: string, position: BonePosition, duration: number = 1000) => {
    const bone = getBone(boneName)
    if (!bone) return
    const targetVector = new Vector3(position[0], position[1], position[2])

    targetPositionsRef.current[boneName] = {
      position: targetVector,
      startTime: performance.now(),
      duration: duration,
      startPosition: bone.position.clone(),
    }
  }, [])

  const applyPose = useCallback(
    (pose?: Pose) => {
      if (!modelRef.current || !pose) return

      if (pose.face) {
        for (const [morphName, targetValue] of Object.entries(pose.face)) {
          modelRef.current.morph.setMorphWeight(morphName, targetValue as number)
        }
      }
      if (pose.movableBones) {
        for (const boneName of Object.keys(pose.movableBones)) {
          const position = pose.movableBones[boneName as keyof MovableBones]
          if (!position || typeof position !== "object") {
            continue
          }
          if (smoothUpdateRef.current) {
            moveBoneSmooth(boneName, position)
          } else {
            moveBone(boneName, position)
          }
        }
      }
      if (pose.rotatableBones) {
        for (const boneName of Object.keys(pose.rotatableBones)) {
          const boneRotationQuaternion = pose.rotatableBones[boneName as keyof RotatableBones]
          if (smoothUpdateRef.current) {
            rotateBoneSmooth(
              boneName,
              new Quaternion(
                boneRotationQuaternion[0],
                boneRotationQuaternion[1],
                boneRotationQuaternion[2],
                boneRotationQuaternion[3]
              )
            )
          } else {
            rotateBone(
              boneName,
              new Quaternion(
                boneRotationQuaternion[0],
                boneRotationQuaternion[1],
                boneRotationQuaternion[2],
                boneRotationQuaternion[3]
              )
            )
          }
        }
      }
    },
    [moveBone, rotateBone, moveBoneSmooth, rotateBoneSmooth]
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
        if (
          Object.keys(RotatableBonesTranslations).includes(bone.name) ||
          Object.keys(MovableBonesTranslations).includes(bone.name)
        ) {
          bonesRef.current[bone.name] = bone
        }
      }

      setTimeout(() => {
        const defaultFace = {} as Morphs
        const defaultMovableBones = {} as MovableBones
        const defaultRotatableBones = {} as RotatableBones
        for (const morph of Object.keys(MorphsTranslations)) {
          defaultFace[morph as keyof Morphs] = 0
        }
        for (const bone of Object.keys(MovableBonesTranslations)) {
          if (bonesRef.current[bone]) {
            const runtimeBone = modelRef.current!.runtimeBones.find((b) => b.name === bone)
            if (runtimeBone) {
              // Get this bone's world matrix
              const worldMatrix = Matrix.FromArray(runtimeBone.worldMatrix, 0)

              // Get parent world matrix (identity if no parent)
              let parentWorldMatrix = Matrix.Identity()
              if (runtimeBone.parentBone) {
                parentWorldMatrix = Matrix.FromArray(runtimeBone.parentBone.worldMatrix, 0)
              }

              // Compute local matrix: local = inverse(parentWorld) * world
              const invParentWorld = parentWorldMatrix.invert()
              const localMatrix = invParentWorld.multiply(worldMatrix)

              // Decompose local matrix to get local position
              const localRotation = new Quaternion()
              const localPosition = new Vector3()
              const localScaling = new Vector3()
              localMatrix.decompose(localScaling, localRotation, localPosition)

              const position: BonePosition = [localPosition.x, localPosition.y, localPosition.z]
              if (!(position[0] === 0 && position[1] === 0 && position[2] === 0)) {
                defaultMovableBones[bone as keyof MovableBones] = position
              }
            }
          }
        }

        for (const bone of Object.keys(RotatableBonesTranslations)) {
          if (bonesRef.current[bone]) {
            const boneRotationQuaternion = bonesRef.current[bone].rotationQuaternion.clone()
            defaultRotatableBones[bone as keyof RotatableBones] = [
              boneRotationQuaternion.x,
              boneRotationQuaternion.y,
              boneRotationQuaternion.z,
              boneRotationQuaternion.w,
            ]
          }
        }
        const defaultPose = {
          description: "",
          face: defaultFace,
          movableBones: defaultMovableBones,
          rotatableBones: defaultRotatableBones,
        }
        defaultPoseRef.current = defaultPose
        defaultPose.description = "default pose"

        setPose(defaultPose)
      }, 200)

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
    async (vpdUrl: string) => {
      if (!vpdLoaderRef.current || !modelRef.current) return

      const vpd = await vpdLoaderRef.current.loadAsync("vpd_pose", vpdUrl)

      const poseVpd = {
        description: "",
        face: {} as Morphs,
        movableBones: {} as MovableBones,
        rotatableBones: {} as RotatableBones,
      }

      for (const boneTrack of vpd.boneTracks) {
        const boneName = boneTrack.name

        if (!Object.keys(RotatableBonesTranslations).includes(boneName)) continue

        const rotations = boneTrack.rotations
        if (rotations.length === 0) continue
        const rotation: BoneRotationQuaternion = [...rotations] as BoneRotationQuaternion

        if (!(rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0 && rotation[3] === 1)) {
          poseVpd.rotatableBones[boneName as keyof typeof poseVpd.rotatableBones] = rotation
        }
      }

      for (const boneTrack of vpd.movableBoneTracks) {
        const boneName = boneTrack.name
        if (!Object.keys(MovableBonesTranslations).includes(boneName)) continue

        const runtimeBone = modelRef.current.runtimeBones.find((b) => b.name === boneName)
        if (runtimeBone) {
          const worldMatrix = Matrix.FromArray(runtimeBone.worldMatrix, 0)

          let parentWorldMatrix = Matrix.Identity()
          if (runtimeBone.parentBone) {
            parentWorldMatrix = Matrix.FromArray(runtimeBone.parentBone.worldMatrix, 0)
          }

          const invParentWorld = parentWorldMatrix.invert()
          const localMatrix = invParentWorld.multiply(worldMatrix)

          const localRotation = new Quaternion()
          const localPosition = new Vector3()
          const localScaling = new Vector3()
          localMatrix.decompose(localScaling, localRotation, localPosition)

          const position: BonePosition = [localPosition.x, localPosition.y, localPosition.z]
          if (!(position[0] === 0 && position[1] === 0 && position[2] === 0)) {
            poseVpd.movableBones[boneName as keyof MovableBones] = position
          }
        }
      }

      setSmoothUpdate(true)
      setPose((prev: Pose) => ({
        ...prev,
        description: "unlabeled pose from vpd",
        face: { ...prev.face, ...poseVpd.face },
        movableBones: { ...prev.movableBones, ...poseVpd.movableBones },
        rotatableBones: { ...prev.rotatableBones, ...poseVpd.rotatableBones },
      }))
    },
    [vpdLoaderRef, modelRef, setPose, setSmoothUpdate]
  )

  const exportPose = useCallback(
    (description: string) => {
      if (pose && defaultPoseRef.current) {
        const exportedPose = {
          description: description,
          face: {} as Morphs,
          movableBones: {} as MovableBones,
          rotatableBones: {} as RotatableBones,
        }
        const defaultPose = defaultPoseRef.current
        for (const [morphName, targetValue] of Object.entries(pose.face)) {
          if (targetValue !== 0) {
            exportedPose.face[morphName as keyof Morphs] = targetValue
          }
        }
        for (const [boneName, position] of Object.entries(pose.movableBones)) {
          if (JSON.stringify(position) !== JSON.stringify(defaultPose.movableBones[boneName as keyof MovableBones])) {
            exportedPose.movableBones[boneName as keyof MovableBones] = position
          }
        }
        for (const [boneName, rotation] of Object.entries(pose.rotatableBones)) {
          if (
            JSON.stringify(rotation) !== JSON.stringify(defaultPose.rotatableBones[boneName as keyof RotatableBones])
          ) {
            exportedPose.rotatableBones[boneName as keyof RotatableBones] = rotation
          }
        }
        const blob = new Blob([JSON.stringify(exportedPose, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${description.trim().replace(/\s+/g, "-").replace(/:/g, "-")}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    },
    [pose, defaultPoseRef]
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

      const directionalLight = new DirectionalLight("directionalLight", new Vector3(2, -19.15, 4), scene)
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
          {!openCustomizePanel && (
            <div className="">
              <Button
                size="icon"
                className="bg-white text-black size-7 rounded-full hover:bg-pink-100 cursor-pointer"
                onClick={() => setOpenCustomizePanel(true)}
              >
                <HandMetal />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ClothesPanel open={openClothesPanel} setOpen={setOpenClothesPanel} meshes={meshes} setMeshes={setMeshes} />
      <CustomizePanel
        open={openCustomizePanel}
        setOpen={setOpenCustomizePanel}
        pose={pose}
        setPose={setPose}
        loadVpd={loadVpd}
        setSmoothUpdate={setSmoothUpdate}
        resetPose={() => loadModel()}
        exportPose={exportPose}
      />
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-0 max-w-2xl mx-auto flex p-4 w-full z-10 ${
          openCustomizePanel || openClothesPanel ? "hidden" : ""
        }`}
      >
        <ChatInput setPose={setPose} setSmoothUpdate={setSmoothUpdate} />
      </div>
    </div>
  )
}
