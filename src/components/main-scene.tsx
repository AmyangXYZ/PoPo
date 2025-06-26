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
  const animationRef = useRef<MmdWasmAnimation>(null)
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
      animationRef.current = animation

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
        if (boneTarget.rotation && Array.isArray(boneTarget.rotation) && boneTarget.rotation.length === 4) {
          const quaternion = new Quaternion(
            boneTarget.rotation[0], // x
            boneTarget.rotation[1], // y
            boneTarget.rotation[2], // z
            boneTarget.rotation[3] // w
          )
          rotateBone(boneName, quaternion, 1000)
        }
      }
    },
    [moveBone, rotateBone]
  )

  const exportPose = useCallback(() => {
    if (!modelRef.current || !animationRef.current) return

    const pose: Pose = {
      face: {},
      body: {},
    } as Pose

    const morphs = modelRef.current.morph.morphs
    for (const morph of morphs) {
      pose.face[morph.name as keyof MorphTargets] = modelRef.current.morph.getMorphWeight(morph.name)
    }

    // Get current animation frame
    const currentFrame = mmdRuntimeRef.current!.currentFrameTime
    console.log(`Exporting pose at frame ${currentFrame}`)

    // Read rotation data directly from animation tracks for all KeyBones
    for (const boneTrack of animationRef.current.boneTracks) {
      const boneName = boneTrack.name

      if (!KeyBones.includes(boneName)) continue

      // Get rotation at current frame by interpolating the track data
      const rotations = boneTrack.rotations
      const frameNumbers = boneTrack.frameNumbers

      if (rotations.length === 0) continue

      // Find the frame data for current time
      let rotation: [number, number, number, number] = [0, 0, 0, 1] // Default identity quaternion

      // Simple approach: find closest frame or interpolate
      if (frameNumbers.length === 1) {
        // Single frame
        const idx = 0
        rotation = [
          rotations[idx * 4 + 0], // x
          rotations[idx * 4 + 1], // y
          rotations[idx * 4 + 2], // z
          rotations[idx * 4 + 3], // w
        ]
      } else {
        // Multiple frames - find surrounding frames and interpolate
        let frameIndex = 0
        for (let i = 0; i < frameNumbers.length - 1; i++) {
          if (currentFrame >= frameNumbers[i] && currentFrame <= frameNumbers[i + 1]) {
            frameIndex = i
            break
          } else if (currentFrame >= frameNumbers[frameNumbers.length - 1]) {
            frameIndex = frameNumbers.length - 1
            break
          }
        }

        if (currentFrame <= frameNumbers[0]) {
          // Before first frame
          frameIndex = 0
        } else if (currentFrame >= frameNumbers[frameNumbers.length - 1]) {
          // After last frame
          frameIndex = frameNumbers.length - 1
        } else {
          // Interpolate between frames
          for (let i = 0; i < frameNumbers.length - 1; i++) {
            if (currentFrame >= frameNumbers[i] && currentFrame < frameNumbers[i + 1]) {
              const t = (currentFrame - frameNumbers[i]) / (frameNumbers[i + 1] - frameNumbers[i])

              // Get quaternions for interpolation
              const q1 = new Quaternion(
                rotations[i * 4 + 0],
                rotations[i * 4 + 1],
                rotations[i * 4 + 2],
                rotations[i * 4 + 3]
              )
              const q2 = new Quaternion(
                rotations[(i + 1) * 4 + 0],
                rotations[(i + 1) * 4 + 1],
                rotations[(i + 1) * 4 + 2],
                rotations[(i + 1) * 4 + 3]
              )

              // Spherical interpolation
              const interpolated = Quaternion.Slerp(q1, q2, t)
              rotation = [interpolated.x, interpolated.y, interpolated.z, interpolated.w]
              break
            }
          }
        }

        // Fallback to specific frame
        if (rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0 && rotation[3] === 1) {
          rotation = [
            rotations[frameIndex * 4 + 0],
            rotations[frameIndex * 4 + 1],
            rotations[frameIndex * 4 + 2],
            rotations[frameIndex * 4 + 3],
          ]
        }
      }

      // Store rotation for this bone
      pose.body[boneName as keyof BoneTargets] = {
        rotation: rotation,
      }
    }

    // Then add position data from runtime bones for IK bones only
    const ikBoneNames = ["センター", "左足ＩＫ", "右足ＩＫ", "右つま先ＩＫ", "左つま先ＩＫ"]
    for (const boneName of ikBoneNames) {
      if (!KeyBones.includes(boneName)) continue

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

        // Decompose local matrix to get local position
        const localRotation = new Quaternion()
        const localPosition = new Vector3()
        const localScaling = new Vector3()
        localMatrix.decompose(localScaling, localRotation, localPosition)

        const position: [number, number, number] = [localPosition.x, localPosition.y, localPosition.z]

        // Add position to existing bone target (which should have rotation from above)
        if (pose.body[boneName as keyof BoneTargets]) {
          ;(pose.body[boneName as keyof BoneTargets] as BoneTargetValue).position = position
        } else {
          // Fallback if no rotation was found in animation tracks
          pose.body[boneName as keyof BoneTargets] = {
            rotation: [0, 0, 0, 1], // Default rotation
            position: position,
          }
        }
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
        if (boneTarget.rotation && Array.isArray(boneTarget.rotation) && boneTarget.rotation.length === 4) {
          const quaternion = new Quaternion(
            boneTarget.rotation[0], // x
            boneTarget.rotation[1], // y
            boneTarget.rotation[2], // z
            boneTarget.rotation[3] // w
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
