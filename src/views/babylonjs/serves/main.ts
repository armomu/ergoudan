import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { WaterMaterial } from '@babylonjs/materials';
import HavokPhysics from '@babylonjs/havok';
import { ThirdPersonController } from './thirdPersonController';
import { useLoading } from '../widgets/loading';
export class BabylonScene {
    public engine!: BABYLON.Engine;
    public scene!: BABYLON.Scene;
    public camera!: BABYLON.ArcRotateCamera;
    public physicsPlugin!: BABYLON.HavokPlugin;
    public shadowGenerator!: BABYLON.ShadowGenerator;
    public axesViewer!: BABYLON.AxesViewer;
    public physicsViewer!: BABYLON.PhysicsViewer;
    public characterController!: ThirdPersonController;
    public LoadingStore = useLoading();
    constructor(_canvas: HTMLCanvasElement) {
        this.main(_canvas);
    }
    private async main(canvas: HTMLCanvasElement) {
        // this.LoadingStore.onShow();
        const havokPlugin = await HavokPhysics();
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        // this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromImages(
        //     [import.meta.env.BASE_URL + '/wii_daisy_circuit/textures/M_Wiidc_VR_baseColor.png'],
        //     this.scene
        // );
        // this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        //     import.meta.env.BASE_URL + '/textures/environment.dds',
        //     this.scene
        // );
        // this.scene.createDefaultSkybox(this.scene.environmentTexture);

        this.physicsPlugin = new BABYLON.HavokPlugin(true, havokPlugin);
        this.scene.enablePhysics(undefined, this.physicsPlugin);
        this.physicsViewer = new BABYLON.PhysicsViewer();
        this.addCamera(canvas);
        // this.addGround();
        // this.loadGltf();
        await this.addLight();
        // this.addAxesViewer();
        // this.addSkybox();
        // this.onTestMap();
        // this.onCollisionMap();
        this.loadWiiDaisyCircuit();
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        const pickingRay = new BABYLON.Ray(
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 1, 0)
        );
        const rayHelper = new BABYLON.RayHelper(pickingRay);
        rayHelper.show(this.scene);
        const raycastResult = new BABYLON.PhysicsRaycastResult();
        const physEngine = this.scene.getPhysicsEngine();
        this.scene.onPointerDown = () => {
            this.scene.createPickingRayToRef(
                this.scene.pointerX,
                this.scene.pointerY,
                null,
                pickingRay,
                this.camera
            );
            (physEngine as any)?.raycastToRef(
                pickingRay.origin,
                pickingRay.origin.add(pickingRay.direction.scale(10000)),
                raycastResult
            );
            if (raycastResult.hasHit) {
                console.log(raycastResult.hitPointWorld);
                // _x: -38.306026458740234, _y: 1.0256233215332031, _z: 21.65768051147461}
            }
        };
    }

    public async loadWiiDaisyCircuit() {
        const res = await this.loadAsset('/wii_daisy_circuit/', 'scene.gltf');
        res.addAllToScene();
        // const a = new BABYLON.AxesViewer();
        const meshes = res.meshes[0];
        meshes.receiveShadows = true;
        meshes.scaling = new BABYLON.Vector3(-60, 60, 60);
        meshes.position.y = -20;

        let oceanSkybox: BABYLON.AbstractMesh | null;

        res.meshes.forEach((meshe, index) => {
            meshe.receiveShadows = true;
            const nos = [
                'M_Building_M_Cmn_MainColor_0',
                'F_Ocean1_M_Wiidc_Ocean_0',
                'VR_mesh_M_Wiidc_VR_0',
                'M_Building_M_Cmn_MainColor_Detail_0',
                'M_Ground_M_Cmn_Audience_0',
                'F_Ground_M_Wiidc_Signboard_0',
                'N_Obj_M_Wiidc_MetalMlt_0',
                'M_Roadside_Obj_M_Wiidc_Plaza_WaterFountain_0',
                'Audience1_M_Wiidc_Signboard_0',
                'N_Road_M_Wiidc_Road_0',
                'N_Road_M_Wiidc_TileFlower_0',
                'F_Obj_M_Cmn_MainColor_0',
            ];
            if (meshe.name === nos[2]) {
                oceanSkybox = meshe;
            }
            if (index === 0 || nos.includes(meshe.name)) return;
            try {
                const res = new BABYLON.PhysicsAggregate(
                    meshe,
                    BABYLON.PhysicsShapeType.MESH,
                    { mass: 0, friction: 0.5 },
                    this.scene
                );
                this.shadowGenerator.addShadowCaster(meshe);
                // this.physicsViewer.showBody(res.body);
            } catch (err) {
                console.log(index, '================');
                console.log(err);
            }
        });
        this.loadPlayer();
        this.addParticleSystem();

        const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture('/textures/ground.jpg', this.scene);
        groundMaterial.diffuseTexture.uScale = groundMaterial.diffuseTexture.vScale = 4;

        const ground = BABYLON.Mesh.CreateGround('ground', 512, 512, 32, this.scene, false);
        ground.position.y = -1;
        ground.material = groundMaterial;

        // Water
        const waterMesh = BABYLON.Mesh.CreateGround('waterMesh', 512, 512, 32, this.scene, false);

        const water = new WaterMaterial('water', this.scene, new BABYLON.Vector2(512, 512));
        water.backFaceCulling = true;
        water.bumpTexture = new BABYLON.Texture('/textures/waterbump.png', this.scene);
        water.windForce = -15;
        water.waveHeight = 1.3;
        water.windDirection = new BABYLON.Vector2(1, 1);
        water.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
        water.colorBlendFactor = 0.3;
        water.bumpHeight = 0.1;
        water.waveLength = 0.1;
        // water.addToRenderList(this.scene.environmentTexture);
        water.addToRenderList(oceanSkybox);
        water.addToRenderList(ground);
        waterMesh.material = water;

        // oceanMeshe.material = this.randomColorMaterial();
    }

    public addParticleSystem() {
        const particleSystem = new BABYLON.GPUParticleSystem(
            'particles',
            { capacity: 20000 * 2 },
            this.scene
        );

        // Texture of each particle
        particleSystem.particleTexture = new BABYLON.Texture(
            '/textures/flare32bits.png',
            this.scene
        );
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

        // Where the particles come from
        particleSystem.createConeEmitter(4, Math.PI / 2);

        // Colors of all particles
        particleSystem.color1 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.4);

        // Size of each particle (random between...
        particleSystem.minSize = 0.5 * 1.5;
        particleSystem.maxSize = 0.5 * 1.5;

        // Life time of each particle (random between...
        particleSystem.minLifeTime = 2.0;
        particleSystem.maxLifeTime = 2.5;

        // Emission rate
        particleSystem.emitRate = 1500 * 2;

        // Set the gravity of all particles
        particleSystem.gravity = new BABYLON.Vector3(0, -10.81, 0);

        // Speed
        particleSystem.minEmitPower = 2.5;
        particleSystem.maxEmitPower = 6.5;
        particleSystem.updateSpeed = 0.02;

        // Start the particle system
        particleSystem.preWarmCycles = 60 * 8;
        particleSystem.emitter = new BABYLON.Vector3(-40.2, 10, 20.87);
        particleSystem.start();
        // this.scene.registerBeforeRender(() => {
        //     const fluidRenderer = this.scene.enableFluidRenderer();
        //     const renderObject = fluidRenderer?.addParticleSystem(particleSystem);

        //     const fluidObject = renderObject?.object;
        //     const targetRenderer = renderObject?.targetRenderer;
        // });
        const p2 = particleSystem.clone('p2', new BABYLON.Vector3(52.3, 10, 21.81));
        p2.start();
    }

    private async loadPlayer() {
        // const zombieRes = await this.loadAsset('/textures/', 'zombie-girl.glb', () => {
        //     this.onProgress(50, 10);
        // });
        // zombieRes.addAllToScene();
        const container = await this.loadAsset('/textures/', 'x-bot.glb', () => {
            this.onProgress(100, 3);
        });
        const [mesheRoot] = container.meshes;
        mesheRoot.receiveShadows = true;
        this.shadowGenerator.addShadowCaster(mesheRoot);
        container.addAllToScene();
        this.characterController = new ThirdPersonController(container, this.camera, this.scene);

        // this.physicsViewer.showBody(this.characterController.physPlayer.body);
        this.LoadingStore.onShow(100);
        setTimeout(() => {
            this.addRandomBox();
            this.LoadingStore.onHide();
        }, 200);
    }

    public onCollisionMap() {
        this.LoadingStore.onShow(1);
        this.addGround();
        // 创建楼梯的参数
        const stepWidth = 4; // 每个步骤的宽度
        const stepHeight = 1; // 每个步骤的高度
        const stepDepth = 2; // 每个步骤的深度
        const numSteps = 7; // 楼梯的步骤数量
        // 创建步骤的循环
        for (let i = 0; i < numSteps; i++) {
            // 计算当前步骤的位置
            const stepPosition = new BABYLON.Vector3(0, i * stepHeight, i * stepDepth);

            // 创建当前步骤的立方体
            const step = BABYLON.MeshBuilder.CreateBox(
                'step' + i,
                { width: stepWidth, height: stepHeight, depth: stepDepth },
                this.scene
            );
            step.position = stepPosition;
            step.receiveShadows = true;
            this.shadowGenerator.addShadowCaster(step);
            this.addPhysicsAggregate(step);
        }

        // 创建斜坡的几何形状
        const slope = BABYLON.MeshBuilder.CreateBox(
            'slope',
            { width: 4, height: 0.1, depth: 12 },
            this.scene
        );
        const slope25 = BABYLON.MeshBuilder.CreateBox(
            'slope',
            { width: 4, height: 0.1, depth: 16 },
            this.scene
        );
        slope.receiveShadows = true;
        slope25.receiveShadows = true;
        this.shadowGenerator.addShadowCaster(slope);
        this.shadowGenerator.addShadowCaster(slope25);
        // 设置斜坡的旋转角度
        slope.rotation.x = BABYLON.Tools.ToRadians(-35); // 绕 X 轴旋转
        slope.position = new BABYLON.Vector3(6, 2.6, 7.16);
        slope.material = this.randomColorMaterial();

        slope25.rotation.x = BABYLON.Tools.ToRadians(-25); // 绕 X 轴旋转
        slope25.position = new BABYLON.Vector3(12, 2.6, 4.7);
        this.addPhysicsAggregate(slope);
        this.addPhysicsAggregate(slope25);

        // 二楼
        const erlou = BABYLON.MeshBuilder.CreateBox(
            'slope2',
            { width: 30, height: 0.1, depth: 30 },
            this.scene
        );
        erlou.position.z = 17 + 10;
        erlou.position.y = 6;

        const pbr = new BABYLON.PBRMaterial('pbr', this.scene);
        pbr.metallic = 0.0;
        pbr.roughness = 0;
        pbr.subSurface.isRefractionEnabled = true;
        pbr.subSurface.indexOfRefraction = 1.8;
        erlou.material = pbr;
        erlou.receiveShadows = true;
        this.shadowGenerator.addShadowCaster(erlou);
        this.addPhysicsAggregate(erlou);

        // 创建传送带
        const conveyor = BABYLON.MeshBuilder.CreateBox(
            'conveyor',
            { width: 20, height: 0.01, depth: 4 },
            this.scene
        );
        conveyor.receiveShadows = true;
        conveyor.position = new BABYLON.Vector3(-5, 0.005, -8);
        const conveyorPhys = this.addPhysicsAggregate(conveyor);
        conveyorPhys.body.setMotionType(1);

        // 电梯
        const box = BABYLON.MeshBuilder.CreateBox(
            'conveyor',
            { width: 12, height: 0.01, depth: 4 },
            this.scene
        );
        box.receiveShadows = true;
        this.shadowGenerator.addShadowCaster(box);
        box.position = new BABYLON.Vector3(-9, 0.005, 9);
        const boxPhys = this.addPhysicsAggregate(box);
        boxPhys.body.setMotionType(1);

        const boxVelocity = new BABYLON.Vector3(0, -2, 0);
        const conveyorVelocity = new BABYLON.Vector3(2, 0, 0);
        this.scene.onBeforeRenderObservable.add(() => {
            if (conveyor.position.x < -10) {
                conveyorVelocity.x = 2;
            }
            if (conveyor.position.x > 10) {
                conveyorVelocity.x = -2;
            }
            if (box.position.y < 0.2) {
                boxVelocity.y = 2;
            }
            if (box.position.y > 7.1) {
                boxVelocity.y = -2;
            }
            boxPhys.body.setLinearVelocity(boxVelocity);
            conveyorPhys.body.setLinearVelocity(conveyorVelocity);
        });
        this.loadPlayer();
    }

    private addCamera(canvas: HTMLCanvasElement) {
        this.camera = new BABYLON.ArcRotateCamera(
            'arcCamera1',
            0,
            0,
            6,
            new BABYLON.Vector3(7, 3, -76),
            this.scene
        );
        this.camera.attachControl(canvas, false);
        // 右上角相机
        // const cam2 = new BABYLON.ArcRotateCamera(
        //     'arcCamera2',
        //     0,
        //     0,
        //     100,
        //     new BABYLON.Vector3(0, 100, 0),
        //     this.scene
        // );

        // cam2.viewport = new BABYLON.Viewport(0.75, 0.75, 180, 101.25);
        // this.scene.activeCameras?.push(this.camera);
        // this.scene.activeCameras?.push(cam2);

        // this.scene.cameraToUseForPointers = this.camera;
        // this.scene.cameraToUseForPointers = cam2;
        this.camera.setPosition(new BABYLON.Vector3(7, 8.14, -76));
        this.camera.lowerRadiusLimit = 3; // 最小缩放;
        // this.camera.upperRadiusLimit = 8; // 最大缩放

        // cam2.setPosition(new BABYLON.Vector3(0, 100, 0));
        // 锁定鼠标指针
        // const isLocked = false;
        // this.scene.onPointerDown = () => {
        //     if (!isLocked) {
        //         canvas.requestPointerLock =
        //             canvas.requestPointerLock ||
        //             canvas.msRequestPointerLock ||
        //             canvas.mozRequestPointerLock ||
        //             canvas.webkitRequestPointerLock ||
        //             false;
        //         if (canvas.requestPointerLock) {
        //             // isLocked = true;
        //             canvas.requestPointerLock();
        //         }
        //     }
        // };
    }

    private addLight() {
        // 环境光
        const hemisphericLight = new BABYLON.HemisphericLight(
            'hemisphericLight',
            new BABYLON.Vector3(0, 30, 0),
            this.scene
        );
        hemisphericLight.intensity = 0.1;

        const lightDirection = new BABYLON.Vector3(0, -90, 200);
        const light = new BABYLON.DirectionalLight('DirectionalLight', lightDirection, this.scene);
        light.position = new BABYLON.Vector3(0, 70, -100);
        light.intensity = 1.5;
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, light);
        // this.shadowGenerator.useKernelBlur = true;
        // this.shadowGenerator.blurKernel = 200;
        this.shadowGenerator.useBlurExponentialShadowMap = true;

        this.shadowGenerator.setDarkness(0.5);
        this.shadowGenerator.filter = BABYLON.ShadowGenerator.FILTER_PCF;
        this.addLigthHelper(light, lightDirection);
        return Promise.resolve();
    }

    public loadAsset(
        rootUrl: string,
        sceneFilename: string,
        callback?: (event: BABYLON.ISceneLoaderProgressEvent) => void
    ): Promise<BABYLON.AssetContainer> {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.LoadAssetContainer(
                import.meta.env.BASE_URL + rootUrl,
                sceneFilename,
                this.scene,
                (container) => {
                    resolve(container);
                },
                (evt) => {
                    callback && callback(evt);
                },
                () => {
                    reject(null);
                }
            );
        });
    }

    /**
     * 更新加载进度
     * @param max 总进度当前最大值
     * @param pros 当前给总进度增加多少🈯值
     */
    private onProgress(max: number, pros: number) {
        if (this.LoadingStore.pct < max) {
            this.LoadingStore.onShow(this.LoadingStore.pct + pros);
        }
    }

    private addAxesViewer() {
        const rayX = new BABYLON.Ray(
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(1, 0, 0),
            3000
        );
        const rayXHelper = new BABYLON.RayHelper(rayX);
        rayXHelper.show(this.scene, new BABYLON.Color3(255, 0, 0));
        const rayY = new BABYLON.Ray(
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 1, 0),
            3000
        );
        const rayYHelper = new BABYLON.RayHelper(rayY);
        rayYHelper.show(this.scene, new BABYLON.Color3(0, 255, 0));
        const rayZ = new BABYLON.Ray(
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            3000
        );
        const rayZHelper = new BABYLON.RayHelper(rayZ);
        rayZHelper.show(this.scene, new BABYLON.Color3(0, 0, 255));
    }

    public addLigthHelper(light: BABYLON.Light, lightDirection: BABYLON.Vector3) {
        const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2 }, this.scene);
        const p = light.getAbsolutePosition();
        const lightRay = new BABYLON.Ray(p, lightDirection, 30);
        const rayHelper = new BABYLON.RayHelper(lightRay);
        rayHelper.show(this.scene, new BABYLON.Color3(0, 255, 0));
        sphere.position = p;
    }

    public randomColorMaterial() {
        // 随机生成一个颜色值
        const num = Math.floor(Math.random() * 16777215).toString(16);
        const randomColor = BABYLON.Color3.FromHexString('#' + num);
        const material = new BABYLON.StandardMaterial('material_' + num, this.scene);
        material.diffuseColor = randomColor;
        return material;
    }

    public addRandomBox() {
        for (let i = 0; i < 30; i++) {
            const pbr = new BABYLON.PBRMaterial('pbr', this.scene);

            pbr.metallic = 0.0;
            pbr.roughness = 0;

            pbr.subSurface.isRefractionEnabled = true;
            pbr.subSurface.indexOfRefraction = 1.8;

            // 使用 MeshBuilder 创建一个立方体，并将它的材质设置为上一步中创建的材质
            let box!: BABYLON.Mesh;
            const key = Math.floor(Math.random() * 6 + 1);
            switch (key) {
                case 1:
                    box = BABYLON.MeshBuilder.CreateSphere(
                        BABYLON.PhysicsShapeType.SPHERE + '',
                        {},
                        this.scene
                    );
                    break;
                case 2:
                    box = BABYLON.MeshBuilder.CreateCapsule(
                        BABYLON.PhysicsShapeType.CAPSULE + '',
                        {},
                        this.scene
                    );
                    break;
                case 3:
                    box = BABYLON.MeshBuilder.CreateCylinder(
                        BABYLON.PhysicsShapeType.CYLINDER + '',
                        {},
                        this.scene
                    );
                    break;
                case 4:
                    box = BABYLON.MeshBuilder.CreateTorus(
                        BABYLON.PhysicsShapeType.BOX + '',
                        {},
                        this.scene
                    );
                    break;
                case 5:
                    box = BABYLON.MeshBuilder.CreateTiledBox(
                        BABYLON.PhysicsShapeType.BOX + '',
                        {},
                        this.scene
                    );
                    break;
                case 6:
                    box = BABYLON.MeshBuilder.CreateBox(
                        BABYLON.PhysicsShapeType.BOX + '',
                        { size: 1 },
                        this.scene
                    );
            }

            box.material = pbr;
            // 将立方体的位置设置为随机位置
            box.position.x = Math.random() * 10 - 6;
            box.position.y = Math.random() * 30 + 10;
            box.position.z = Math.random() * 10 + 1;
            new BABYLON.PhysicsAggregate(box, parseInt(box.name), { mass: 100 }, this.scene);
            this.shadowGenerator && this.shadowGenerator.addShadowCaster(box);
            if (box.physicsBody) {
                // this.physicsViewer.showBody(box.physicsBody);
            }
        }
    }

    public addSkybox() {
        const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 20000 }, this.scene);
        sphere.infiniteDistance = true;
        const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', this.scene);
        sphereMaterial.emissiveTexture = new BABYLON.Texture(
            import.meta.env.BASE_URL + '/skybox.png',
            this.scene
        );
        sphereMaterial.emissiveTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE;
        sphereMaterial.backFaceCulling = false;
        sphereMaterial.disableLighting = true;
        sphere.material = sphereMaterial;
    }

    public dispose() {
        this.engine?.dispose();
        this.scene?.actionManager?.dispose();
        this.scene?.dispose();
        this.camera?.dispose();
        this.physicsPlugin?.dispose();
    }

    private addGround() {
        const ground = BABYLON.MeshBuilder.CreateGround(
            'ground',
            { width: 100, height: 100 },
            this.scene
        );
        const material = new BABYLON.StandardMaterial('material', this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 1, 0.5);
        ground.material = material;
        ground.checkCollisions = true;
        ground.receiveShadows = true;
        // ground.position.y = -0.01;
        ground.position.z = 15;
        console.log(ground.position.y);
        this.addPhysicsAggregate(ground);
    }

    private addPhysicsAggregate(meshe: BABYLON.TransformNode) {
        const res = new BABYLON.PhysicsAggregate(
            meshe,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.5 },
            this.scene
        );
        // this.physicsViewer.showBody(res.body);
        return res;
    }
}

function getImageFileFromUrl(url: string): Promise<File> {
    return new Promise((resolve, reject) => {
        let blob = null;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Accept', 'image/png');
        xhr.responseType = 'blob';
        // 加载时处理
        xhr.onload = () => {
            // 获取返回结果
            blob = xhr.response;
            const imgFile = new File([blob], 'img', { type: 'image/png' });
            // 返回结果
            resolve(imgFile);
        };
        xhr.onerror = (e) => {
            reject(e);
        };
        // 发送
        xhr.send();
    });
}
