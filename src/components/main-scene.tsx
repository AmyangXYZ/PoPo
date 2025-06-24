'use client'

import { ArcRotateCamera, Color3, Color4, CreateDisc, DirectionalLight, Engine, HemisphericLight, ImportMeshAsync, Mesh, RegisterSceneLoaderPlugin, Scene, ShadowGenerator, StandardMaterial, Vector3 } from "@babylonjs/core";
import { useRef, useEffect, useState } from "react";
import {
    MmdWasmModel,
    PmxLoader,
    SdefInjector,
    MmdWasmInstanceTypeMPR,
    GetMmdWasmInstance,
    MmdWasmRuntime,
    MmdWasmPhysics,
    type IMmdWasmInstance,
} from "babylon-mmd"

export default function MainScene() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine>(null);
    const sceneRef = useRef<Scene>(null);
    const shadowGeneratorRef = useRef<ShadowGenerator>(null);
    const mmdWasmInstanceRef = useRef<IMmdWasmInstance>(null);
    const mmdRuntimeRef = useRef<MmdWasmRuntime>(null);
    const modelRef = useRef<MmdWasmModel>(null);

    const [fps, setFps] = useState(0);

    const loadModel = async (): Promise<void> => {
        if (!sceneRef.current || !mmdWasmInstanceRef.current || !mmdRuntimeRef.current) return
        if (modelRef.current) {
            mmdRuntimeRef.current.destroyMmdModel(modelRef.current)
            modelRef.current.mesh.dispose()
        }

        ImportMeshAsync(`/models/深空之眼-塞勒涅/深空之眼-塞勒涅.pmx`, sceneRef.current!).then(
            (result) => {
                const mesh = result.meshes[0]
                for (const m of mesh.metadata.meshes) {
                    m.receiveShadows = true
                }
                shadowGeneratorRef.current!.addShadowCaster(mesh)
                modelRef.current = mmdRuntimeRef.current!.createMmdModel(mesh as Mesh, {
                    buildPhysics: {
                        disableOffsetForConstraintFrame: true
                    },
                })
            }
        )
    }

    useEffect(() => {
        const resize = () => {
            if (sceneRef.current) {
                sceneRef.current.getEngine().resize();
            }
        };

        const init = async () => {
            if (!canvasRef.current) return;

            // Register the PMX loader plugin
            RegisterSceneLoaderPlugin(new PmxLoader())

            const engine = new Engine(canvasRef.current, true, {}, true);
            SdefInjector.OverrideEngineCreateEffect(engine)

            const scene = new Scene(engine);
            scene.clearColor = new Color4(0.96, 0.38, 0.54, 1.0);
            scene.ambientColor = new Color3(0.18, 0.12, 0.10);

            engineRef.current = engine;
            sceneRef.current = scene;

            const camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 45, new Vector3(0, 12, 0), scene)
            camera.setPosition(new Vector3(0, 19, -25))
            camera.attachControl(canvasRef.current, false)
            camera.inertia = 0.8
            camera.speed = 10

            scene.activeCameras = [camera]

            const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
            hemisphericLight.intensity = 0.7;
            hemisphericLight.specular = new Color3(0, 0, 0);
            hemisphericLight.groundColor = new Color3(1, 1, 1);

            const directionalLight = new DirectionalLight("directionalLight", new Vector3(5, -10, 10), scene);
            directionalLight.intensity = 1;

            const shadowGenerator = new ShadowGenerator(2048, directionalLight)
            shadowGenerator.usePercentageCloserFiltering = true
            shadowGenerator.forceBackFacesOnly = true
            shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH
            // shadowGenerator.frustumEdgeFalloff = 0.1
            // shadowGenerator.transparencyShadow = true
            shadowGeneratorRef.current = shadowGenerator

            mmdWasmInstanceRef.current = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR())
            const mmdRuntime = new MmdWasmRuntime(mmdWasmInstanceRef.current, scene, new MmdWasmPhysics(scene));
            mmdRuntime.register(scene)
            mmdRuntimeRef.current = mmdRuntime

            const ground = CreateDisc("stageGround", { radius: 28, tessellation: 64 }, scene);
            const groundMaterial = new StandardMaterial("groundMaterial", scene);
            groundMaterial.diffuseColor = new Color3(1.02, 1.02, 1.02);
            ground.material = groundMaterial;
            ground.rotation.x = Math.PI / 2;
            ground.receiveShadows = true;

            loadModel()

            window.addEventListener("resize", resize);

            engine.runRenderLoop(() => {
                scene.render()
                setFps(engine.getFps())
            });
        }
        init()

        return () => {
            if (engineRef.current) {
                engineRef.current.dispose();
                window.removeEventListener("resize", resize);
            }
        };
    }, []);

    return (
        <div className="w-full h-full">
            <div className="absolute top-2 left-2 text-white text-sm">FPS: {Math.round(fps)}</div>
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}