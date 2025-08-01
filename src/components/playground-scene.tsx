"use client"

import {
    ArcRotateCamera,
    Camera,
    Color3,
    Color4,
    CreateDisc,
    CreateScreenshotAsync,
    DirectionalLight,
    Engine,
    HemisphericLight,
    LoadAssetContainerAsync,
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
    BpmxLoader,
    VmdLoader,
    MmdPlayerControl,
} from "babylon-mmd"

import { MmdWasmPhysicsRuntimeImpl } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysicsRuntimeImpl"
import MPLEditor from "./mpl-editor"
import { MPLBoneFrame, Quaternion as MPLQuaternion, Vector3 as MPLVector3 } from "mmd-mpl"
import { useMPLCompiler } from "@/hooks/useMPLCompiler"
import { Pose } from "@/lib/database"
import { Aperture, User } from "lucide-react"
import { Button } from "./ui/button"
import ModelsPanel from "./models-panel"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export default function PlaygroundScene({ pose }: { pose: Pose | null }) {
    const mplCompiler = useMPLCompiler()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<Engine>(null)
    const sceneRef = useRef<Scene>(null)
    const cameraRef = useRef<Camera>(null)
    const shadowGeneratorRef = useRef<ShadowGenerator>(null)
    const mmdWasmInstanceRef = useRef<IMmdWasmInstance>(null)
    const mmdRuntimeRef = useRef<MmdWasmRuntime>(null)
    const mmdMaterialBuilderRef = useRef<MmdStandardMaterialBuilder>(null)
    const vpdLoaderRef = useRef<VpdLoader>(null)
    const vmdLoaderRef = useRef<VmdLoader>(null)
    const modelRef = useRef<MmdWasmModel>(null)

    const modelNameRef = useRef("深空之眼-梵天")
    const [openModelsPanel, setOpenModelsPanel] = useState(false)
    const lastVMDUrlRef = useRef("")

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
        if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current || !mplCompiler || !modelNameRef.current) return
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
            shadowGeneratorRef.current!.addShadowCaster(mesh)
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
    }, [mplCompiler, loadVMD])



    const selectModel = useCallback((model: string) => {
        modelNameRef.current = model
        loadModel()
    }, [loadModel])

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

            scene.clearColor = new Color4(0.99, 0.44, 0.66, 1.0)

            engineRef.current = engine
            sceneRef.current = scene

            const camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 45, new Vector3(0, 12, 0), scene)
            camera.setPosition(new Vector3(0, 19, -25))
            camera.attachControl(canvasRef.current, false)
            camera.inertia = 0.8
            camera.speed = 10
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

            const shadowGenerator = new ShadowGenerator(2048, directionalLight)
            shadowGeneratorRef.current = shadowGenerator

            mmdWasmInstanceRef.current = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR())
            const mmdRuntime = new MmdWasmRuntime(mmdWasmInstanceRef.current, scene, new MmdWasmPhysics(scene))
            mmdRuntime.register(scene)
            mmdRuntimeRef.current = mmdRuntime

            const ground = CreateDisc("stageGround", { radius: 16, tessellation: 64 }, scene)
            const groundMaterial = new StandardMaterial("groundMaterial", scene)
            groundMaterial.diffuseColor = new Color3(0.95, 0.98, 1.0)
            groundMaterial.emissiveColor = new Color3(0.2, 0.25, 0.3)
            groundMaterial.specularColor = new Color3(0.9, 0.9, 0.9)
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
            vmdLoaderRef.current = new VmdLoader(scene)
            new MmdPlayerControl(scene, mmdRuntime)

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

    const takeScreenshot = useCallback(() => {
        if (!canvasRef.current || !engineRef.current || !cameraRef.current) return
        CreateScreenshotAsync(engineRef.current!, cameraRef.current!, { precision: 1 }).then((b64) => {
            const link = document.createElement("a")
            link.href = b64
            link.download = "popo_screenshot.png"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        })
    }, [canvasRef])

    return (
        <div className="w-full h-full flex flex-col md:flex-row">
            <div className="w-full h-[70%] md:w-1/2 md:h-full order-1 md:order-2">
                <canvas ref={canvasRef} className="w-full h-full z-1" />
                <div className="absolute flex justify-end top-[50%] -translate-y-1/2 right-0 mx-auto flex px-4 z-20">
                    <div className="flex flex-col items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="bg-white text-black size-7 rounded-full hover:bg-pink-100 cursor-pointer"
                                    onClick={() => setOpenModelsPanel(true)}
                                >
                                    <User />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Switch Models</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="bg-white text-black size-7 rounded-full hover:bg-pink-100 cursor-pointer"
                                    onClick={() => takeScreenshot()}
                                >
                                    <Aperture />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Take Screenshot</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <ModelsPanel open={openModelsPanel} setOpen={setOpenModelsPanel} selectedModel={modelNameRef.current} selectModel={selectModel} />
            </div>
            <div className="w-full h-[30%] md:w-1/2 md:h-full order-2 md:order-1 border-t">
                <MPLEditor loadVPD={loadVPD} modelLoaded={modelLoaded} loadVMD={loadVMD} pose={pose} />
            </div>
        </div>
    )
}
