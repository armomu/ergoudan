import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';
import { ThirdPersonController } from './thirdPersonController';
export class BabylonScene {
    public engine!: BABYLON.Engine;
    public scene!: BABYLON.Scene;
    public camera!: BABYLON.ArcRotateCamera;
    public physicsPlugin!: BABYLON.HavokPlugin;
    public shadowGenerator!: BABYLON.ShadowGenerator;
    public axesViewer!: BABYLON.AxesViewer;
    public physicsViewer!: BABYLON.PhysicsViewer;
    public characterController!: ThirdPersonController;
    constructor(_canvas: HTMLCanvasElement) {
        this.main(_canvas);
    }
    private async main(canvas: HTMLCanvasElement) {
        const havokPlugin = await HavokPhysics();
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.physicsPlugin = new BABYLON.HavokPlugin(true, havokPlugin);
        this.scene.enablePhysics(undefined, this.physicsPlugin);
        this.physicsViewer = new BABYLON.PhysicsViewer();
        this.addCamera(canvas);
        this.addLight();
        this.loadPlayer();
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // 创建一个定时器，每30帧执行一次场景的渲染
        // const targetFps = 30;
        // const interval = 1000 / targetFps;
        // let lastTime = performance.now();
        // this.engine.runRenderLoop(() => {
        //     const now = performance.now();
        //     if (now - lastTime >= interval) {
        //         this.scene.render();
        //         lastTime = now;
        //     }
        // });
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    public addCollisionMap() {
        // 创建楼梯的参数
        const stepWidth = 4; // 每个步骤的宽度
        const stepHeight = 0.5; // 每个步骤的高度
        const stepDepth = 2; // 每个步骤的深度
        const numSteps = 13; // 楼梯的步骤数量
        // 创建步骤的循环
        for (let i = 0; i < numSteps; i++) {
            // 计算当前步骤的位置
            const stepPosition = new BABYLON.Vector3(0, i * stepHeight, i * stepDepth - 10);

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
        conveyor.position = new BABYLON.Vector3(-5, 0.005, -15);
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

    public async addLevelTest(): Promise<BABYLON.AssetContainer> {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.LoadAssetContainer(
                import.meta.env.BASE_URL + '/textures/',
                'levelTest.glb',
                this.scene,
                (container) => {
                    new BABYLON.AxesViewer(this.scene, 3);
                    const [rootMesh] = container.meshes;
                    rootMesh.position = new BABYLON.Vector3(-30, 0, -20);
                    rootMesh.scaling = new BABYLON.Vector3(3, 3, 3);
                    container.addAllToScene();
                    const lightmap = new BABYLON.Texture(
                        import.meta.env.BASE_URL + '/textures/lightmap.jpg'
                    );
                    // Meshes using the lightmap
                    const lightmapped = [
                        'level_primitive0',
                        'level_primitive1',
                        'level_primitive2',
                    ];
                    lightmapped.forEach((meshName) => {
                        const mesh = this.scene.getMeshByName(meshName) as any;
                        // Create static physics shape for these particular meshes
                        new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, {
                            mass: 0,
                            friction: 1.2,
                        });
                        mesh.isPickable = false;
                        mesh.material.lightmapTexture = lightmap;
                        mesh.material.useLightmapAsShadowmap = true;
                        mesh.material.lightmapTexture.uAng = Math.PI;
                        mesh.material.lightmapTexture.level = 1.6;
                        mesh.material.lightmapTexture.coordinatesIndex = 1;
                        mesh.freezeWorldMatrix();
                        mesh.doNotSyncBoundingInfo = true;
                    });
                    const cubes = [
                        'Cube',
                        'Cube.001',
                        'Cube.002',
                        'Cube.003',
                        'Cube.004',
                        'Cube.005',
                    ];
                    cubes.forEach((meshName) => {
                        new BABYLON.PhysicsAggregate(
                            this.scene.getMeshByName(meshName) as any,
                            BABYLON.PhysicsShapeType.BOX,
                            { mass: 0.1 }
                        );
                    });
                    // inclined plane
                    const planeMesh = this.scene.getMeshByName('Cube.006');
                    planeMesh?.scaling.set(0.03, 3, 1);
                    const fixedMass = new BABYLON.PhysicsAggregate(
                        this.scene.getMeshByName('Cube.007') as any,
                        BABYLON.PhysicsShapeType.BOX,
                        { mass: 0 }
                    );
                    const plane = new BABYLON.PhysicsAggregate(
                        planeMesh as any,
                        BABYLON.PhysicsShapeType.BOX,
                        {
                            mass: 0.1,
                        },
                        this.scene
                    );

                    // plane joint
                    const joint = new BABYLON.HingeConstraint(
                        new BABYLON.Vector3(0.75, 0, 0),
                        new BABYLON.Vector3(-0.25, 0, 0),
                        new BABYLON.Vector3(0, 0, -1),
                        new BABYLON.Vector3(0, 0, 1),
                        this.scene
                    );
                    fixedMass.body.addConstraint(plane.body, joint);
                    resolve(container);
                },
                () => {
                    // console.log(evt);
                },
                () => {
                    reject(null);
                }
            );
        });
    }

    private async loadPlayer() {
        try {
            // this.scene.
            this.engine.displayLoadingUI();
            const res = await this.addLevelTest();
            res.meshes.forEach((mesh, index) => {
                if (index) {
                    mesh.receiveShadows = true;
                    // this.shadowGenerator?.addShadowCaster(mesh);
                }
            });
            this.characterController = new ThirdPersonController(
                this.camera,
                this.scene,
                this.shadowGenerator
            );
            this.addRandomBox();
            // this.engine.hideLoadingUI();
            console.log(this.scene);
        } catch (err) {
            console.log('err=============');
            console.log(err);
            this.engine.hideLoadingUI();
        }
    }

    private addCamera(canvas: HTMLCanvasElement) {
        this.camera = new BABYLON.ArcRotateCamera(
            'arcCamera1',
            0,
            0,
            6,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(canvas, false);

        this.camera.setPosition(new BABYLON.Vector3(0, 8.14, -9.26));
        this.camera.lowerRadiusLimit = 3; // 最小缩放;
        // this.camera.upperRadiusLimit = 8; // 最大缩放
        console.log(import.meta.env.MODE);
        // 锁定鼠标指针
        let isLocked = false;
        this.scene.onPointerDown = () => {
            if (!isLocked && import.meta.env.MODE === 'production') {
                canvas.requestPointerLock = canvas.requestPointerLock || false;
                if (canvas.requestPointerLock) {
                    isLocked = true;
                    canvas.requestPointerLock();
                }
            }
        };
    }

    private addLight() {
        // 环境光
        const hemisphericLight = new BABYLON.HemisphericLight(
            'hemisphericLight',
            new BABYLON.Vector3(0, 30, 0),
            this.scene
        );
        hemisphericLight.intensity = 0.3;

        const lightDirection = new BABYLON.Vector3(-6, -30, 0);
        const light = new BABYLON.DirectionalLight('DirectionalLight', lightDirection, this.scene);
        light.position = new BABYLON.Vector3(0, 40, 6);
        light.intensity = 0.8;
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, light);
        // this.shadowGenerator.useKernelBlur = true;
        // this.shadowGenerator.blurKernel = 200;
        this.shadowGenerator.useBlurExponentialShadowMap = true;

        this.shadowGenerator.setDarkness(0.5);
        this.shadowGenerator.filter = BABYLON.ShadowGenerator.FILTER_PCF;
        this.addLigthHelper(light, lightDirection);
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
            { width: 500, height: 500 },
            this.scene
        );
        const material = new BABYLON.StandardMaterial('material', this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 1, 0.5);
        ground.material = material;
        ground.checkCollisions = true;
        ground.receiveShadows = true;
        // ground.position.y = -0.01;
        ground.position.z = 15;
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
