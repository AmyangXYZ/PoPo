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
  Matrix,
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
  MmdPlayerControl,
  VmdLoader,
  MmdWasmAnimation,
} from "babylon-mmd"
import ChatInput from "./chat-input"
import { BoneTargets, BoneTargetValue, KeyBones, MorphTargets, Pose } from "@/lib/pose"
import { IMmdRuntimeLinkedBone } from "babylon-mmd/esm/Runtime/IMmdRuntimeLinkedBone"
import { Button } from "./ui/button"

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
  const modelRef = useRef<MmdWasmModel>(null)
  const bonesRef = useRef<{ [key: string]: IMmdRuntimeLinkedBone }>({})
  const targetRotationsRef = useRef<{ [key: string]: TargetRotation }>({})
  const targetPositionsRef = useRef<{ [key: string]: TargetPosition }>({})
  const [pose, setPose] = useState<Pose>({} as Pose)

  const getBone = (name: string): IMmdRuntimeLinkedBone | null => {
    return bonesRef.current[name]
  }

  const rotateBone = useCallback((boneName: string, targetQuaternion: Quaternion, duration: number = 1000) => {
    const bone = getBone(boneName)
    if (!bone) return

    targetRotationsRef.current[boneName] = {
      quaternion: targetQuaternion,
      startTime: performance.now(),
      duration: duration,
      startQuaternion: bone.rotationQuaternion || new Quaternion(),
    }
  }, [])

  const moveBone = useCallback(
    (boneName: string, targetPosition: [number, number, number], duration: number = 1000) => {
      const bone = getBone(boneName)
      if (!bone) return

      const targetVector = new Vector3(targetPosition[0], targetPosition[1], targetPosition[2])

      targetPositionsRef.current[boneName] = {
        position: targetVector,
        startTime: performance.now(),
        duration: duration,
        startPosition: bone.position.clone(),
      }
    },
    []
  )

  const loadModel = useCallback(async (): Promise<void> => {
    if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current) return
    if (modelRef.current) {
      mmdRuntimeRef.current.destroyMmdModel(modelRef.current)
      modelRef.current.mesh.dispose()
    }

    ImportMeshAsync(`/models/深空之眼-托特/深空之眼-托特.pmx`, sceneRef.current!, {
      pluginOptions: {
        mmdmodel: {
          materialBuilder: mmdMaterialBuilderRef.current || undefined,
        },
      },
    }).then(async (result) => {
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

      for (const bone of modelRef.current!.skeleton.bones) {
        if (KeyBones.includes(bone.name)) {
          bonesRef.current[bone.name] = bone
        }
      }

      const vmd = await new VmdLoader(sceneRef.current!).loadAsync("vmd", "/animations/Miku.vmd")
      const animation = new MmdWasmAnimation(vmd, mmdWasmInstanceRef.current!, sceneRef.current!)
      modelRef.current!.addAnimation(animation)
      modelRef.current!.setAnimation("vmd")
      mmdRuntimeRef.current!.seekAnimation(5 * 30 + 5, true)

      // getBone("右足ＩＫ")!.position = new Vector3(0, 5, -10)

      //   const material = modelRef.current!.mesh.metadata.materials.find((m: Material) => m.name === "胸口")
      //   const m = modelRef.current!.mesh.metadata.meshes.find((m: Mesh) => m.name === "胸口")
      //   if (material && m) {
      //     material.alpha = 0.5
      //     m.visibility = 0
      //   }
    })
  }, [])

  const importPose = useCallback(
    (pose: Pose) => {
      if (!modelRef.current) return
      for (const [morphName, targetValue] of Object.entries(pose.face)) {
        try {
          modelRef.current.morph.setMorphWeight(morphName, targetValue as number)
        } catch {
          console.log(`Morph "${morphName}" not found`)
        }
      }

      // Process all bones without special sorting or adjustments
      const boneNames = Object.keys(pose.body)

      for (const boneName of boneNames) {
        const targetValue = pose.body[boneName as keyof BoneTargets] as BoneTargetValue
        if (!targetValue || typeof targetValue !== "object") {
          continue
        }

        const boneTarget = targetValue as BoneTargetValue

        // Apply position only for IK bones
        if (boneTarget.position && Array.isArray(boneTarget.position) && boneTarget.position.length === 3) {
          if (["センター", "左足ＩＫ", "右足ＩＫ", "右つま先ＩＫ", "左つま先ＩＫ"].includes(boneName)) {
            moveBone(boneName, boneTarget.position as [number, number, number], 1000)
          }
        }

        // Apply rotation for all bones
        if (boneTarget.rotation && Array.isArray(boneTarget.rotation) && boneTarget.rotation.length === 3) {
          const quaternion = Quaternion.RotationYawPitchRoll(
            boneTarget.rotation[1], // yaw (Y)
            boneTarget.rotation[0], // pitch (X)
            boneTarget.rotation[2] // roll (Z)
          )
          rotateBone(boneName, quaternion, 1000)
        }
      }
    },
    [moveBone, rotateBone]
  )

  const exportPose = useCallback(() => {
    if (!modelRef.current) return
    const pose: Pose = {
      face: {},
      body: {},
    } as Pose

    const morphs = modelRef.current.morph.morphs
    for (const morph of morphs) {
      pose.face[morph.name as keyof MorphTargets] = modelRef.current.morph.getMorphWeight(morph.name)
    }

    // Process all bones without special sorting or adjustments
    const boneNames = Object.keys(bonesRef.current)

    for (const boneName of boneNames) {
      const bone = bonesRef.current[boneName]
      const runtimeBone = modelRef.current.runtimeBones.find((b) => b.name === boneName)

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

        // Decompose local matrix to get local rotation and position
        const localRotation = new Quaternion()
        const localPosition = new Vector3()
        const localScaling = new Vector3()
        localMatrix.decompose(localScaling, localRotation, localPosition)

        // Store rotation for all bones, but only position for IK bones
        const eulerAngles = localRotation.toEulerAngles()
        const boneTarget: BoneTargetValue = {
          rotation: [eulerAngles.x, eulerAngles.y, eulerAngles.z],
        }

        // Only add position for IK bones
        if (["センター", "左足ＩＫ", "右足ＩＫ", "右つま先ＩＫ", "左つま先ＩＫ"].includes(boneName)) {
          boneTarget.position = [localPosition.x, localPosition.y, localPosition.z]
        }

        pose.body[boneName as keyof BoneTargets] = boneTarget
      } else {
        // Fallback to bone's own values if runtime bone not found
        const rotation = bone.rotationQuaternion || new Quaternion()
        const eulerAngles = rotation.toEulerAngles()
        const boneTarget: BoneTargetValue = {
          rotation: [eulerAngles.x, eulerAngles.y, eulerAngles.z],
        }

        // Only add position for IK bones
        if (["センター", "左足ＩＫ", "右足ＩＫ", "右つま先ＩＫ", "左つま先ＩＫ"].includes(boneName)) {
          const position = bone.position.clone()
          boneTarget.position = [position.x, position.y, position.z]
        }

        pose.body[boneName as keyof BoneTargets] = boneTarget
      }
    }
    console.log("Final pose:", pose)
    modelRef.current.removeAnimation(0)
    importPose(pose)
  }, [importPose])

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

      const mmdPlayerControl = new MmdPlayerControl(scene, mmdRuntime, undefined)
      mmdPlayerControl.showPlayerControl()

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
    if (modelRef.current && pose && pose.face && pose.body) {
      console.log(pose)
      modelRef.current.morph.resetMorphWeights()

      // Clear existing target rotations and positions
      targetRotationsRef.current = {}
      targetPositionsRef.current = {}

      // Smoothly reset all bones to identity rotation
      for (const bone of modelRef.current.skeleton.bones) {
        if (KeyBones.includes(bone.name)) {
          rotateBone(bone.name, new Quaternion(), 300) // Quick reset over 300ms
        }
      }

      for (const [boneName, targetValue] of Object.entries(pose.body)) {
        const bone = getBone(boneName)
        if (!bone || !targetValue || typeof targetValue !== "object") {
          continue
        }

        const boneTarget = targetValue as BoneTargetValue

        // Apply position only for IK bones
        if (boneTarget.position && Array.isArray(boneTarget.position) && boneTarget.position.length === 3) {
          if (["センター", "左足ＩＫ", "右足ＩＫ", "右つま先ＩＫ", "左つま先ＩＫ"].includes(boneName)) {
            moveBone(boneName, boneTarget.position as [number, number, number], 1000)
          }
        }

        // Apply rotation for all bones
        if (boneTarget.rotation && Array.isArray(boneTarget.rotation) && boneTarget.rotation.length === 3) {
          const quaternion = Quaternion.RotationYawPitchRoll(
            boneTarget.rotation[1], // yaw (Y)
            boneTarget.rotation[0], // pitch (X)
            boneTarget.rotation[2] // roll (Z)
          )
          rotateBone(boneName, quaternion, 1000)
        }
      }
    }
  }, [pose, rotateBone, moveBone])

  return (
    <div className="w-full h-full">
      <div className="fixed max-w-2xl mx-auto flex p-4 w-full">
        <Button
          onClick={() => {
            exportPose()
          }}
        >
          Export pose
        </Button>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 max-w-2xl mx-auto flex p-4 w-full">
        <ChatInput setPose={setPose} />
      </div>
    </div>
  )
}
