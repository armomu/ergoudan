import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import type { IPhysicsEngine } from '@babylonjs/core/Physics/IPhysicsEngine';

export class ThirdPersonController {
    private player!: BABYLON.AbstractMesh;
    private aggregatePlayer!: BABYLON.PhysicsAggregate;
    private scene!: BABYLON.Scene;
    private camera!: BABYLON.ArcRotateCamera;

    // 地板物理光线拾取
    private physEngine: BABYLON.Nullable<IPhysicsEngine>;
    private engine!: BABYLON.AbstractEngine;

    private playerDirection = -1;
    private velocity = new BABYLON.Vector3(0, -9.8, 0);
    private fps = 0;
    private iswsad = false;
    private inputMap: InputMap = {};
    public meshContent!: BABYLON.AssetContainer;
    private deltaTime = '0';
    private wallkingSound!: BABYLON.Sound;

    // 实时足部光线投射 状
    private footRaycast = new BABYLON.PhysicsRaycastResult();
    private jumpState = {
        startHeight: 0, // 起跳初始高度
        limit: 4, // 设置可跳高度
        jump: false,
        fall: false,
        hasTask: false, //
    };

    // 楼梯光线
    private staircaseRay!: BABYLON.Ray;
    private staircaseRaycast = new BABYLON.PhysicsRaycastResult();
    private staircaseState = {
        height: 0, // 楼梯高度
        uping: false, // 上推中
        task: false, //
    };

    /**
     * Creates a new ThirdPersonController
     * @param camera BABYLON.ArcRotateCamera
     * @param scene BABYLON.Scene
     */
    constructor(camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene) {
        this.scene = scene;
        this.camera = camera;
        this.physEngine = this.scene.getPhysicsEngine();
        this.engine = this.scene.getEngine();
        this.fpsView();
        this.initGenerate();
    }

    private async initGenerate() {
        this.meshContent = await this.loadAsset('/textures/', 'x-bot.glb');
        const [mesheRoot] = this.meshContent.meshes;
        mesheRoot.receiveShadows = true;
        this.meshContent.addAllToScene();

        this.boxHelper = BABYLON.MeshBuilder.CreateBox('lbl', { height: 3.2 }, this.scene);
        this.boxHelper.visibility = 0;
        this.boxHelper.position.y = 3;
        this.meshContent.animationGroups.forEach((item, index) => {
            item.play(true);
            if (index === AnimationKey.Idle) {
                item.setWeightForAllAnimatables(1);
            } else {
                item.setWeightForAllAnimatables(0);
            }
        });
        const player = BABYLON.MeshBuilder.CreateCapsule(
            'lbl',
            { height: 3.6, radius: 0.5 },
            this.scene
        );
        player.visibility = 0;
        mesheRoot.position.y = 5 - 1.8;
        mesheRoot.position.z = -5;
        player.checkCollisions = true;
        mesheRoot.scaling = new BABYLON.Vector3(2, 2, 2);
        player.position.y = 5;
        player.position.z = -5;
        player.addChild(mesheRoot);
        this.player = player;
        this.camera?.setTarget(player);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.staircaseRay = new BABYLON.Ray();
        const rayHelper = new BABYLON.RayHelper(this.staircaseRay);
        rayHelper.attachToMesh(
            mesheRoot,
            new BABYLON.Vector3(0, -1, 0),
            new BABYLON.Vector3(0, 0.4, 0.36),
            0.23
        );
        // rayHelper.show(this.scene);
        const aggregate = new BABYLON.PhysicsAggregate(
            player,
            BABYLON.PhysicsShapeType.CAPSULE,
            { mass: 1, friction: 0.5, restitution: 0 },
            this.scene
        );

        aggregate.body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC);
        aggregate.body.disablePreStep = false;
        aggregate.body.setMassProperties({
            inertia: new BABYLON.Vector3(0, 0, 0),
        });
        aggregate.body.setCollisionCallbackEnabled(true);
        const observable = aggregate.body.getCollisionObservable();
        observable.add(this.onCollision.bind(this));
        this.aggregatePlayer = aggregate;

        this.scene.actionManager = new BABYLON.ActionManager();
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
                this.inputKeyState(evt.sourceEvent.code, evt.sourceEvent.type === 'keydown');
            })
        );
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
                this.inputKeyState(evt.sourceEvent.code, evt.sourceEvent.type === 'keydown');
                this.inputKeyUp();
            })
        );

        this.scene?.onBeforeRenderObservable.add(this.onBeforeRender.bind(this));
        this.scene?.onBeforeAnimationsObservable.add(this.onBeforeAnimations.bind(this));
        this.wallkingSound = new BABYLON.Sound(
            'wallking_sound',
            '/ergoudan/sound/walking.wav',
            this.scene,
            null,
            {
                loop: true,
            }
        );
    }

    private onBeforeRender = () => {
        this.fps = this.engine.getFps();
        this.fpsTextBlock.text = `FPS ${this.fps.toFixed(0)}`;
        this.deltaTime = this.engine.getDeltaTime().toFixed();
        this.updateState();
    };

    private onBeforeAnimations = () => {
        // 给当前动画增加权重从0加到1
        if (this.curAnimParam.weight < 1) {
            this.curAnimParam.weight = BABYLON.Scalar.Clamp(this.curAnimParam.weight + 0.05, 0, 1);
            const anim = this.meshContent.animationGroups[this.curAnimParam.anim];
            anim.setWeightForAllAnimatables(this.curAnimParam.weight);
            this.meshContent.animationGroups.forEach((ani, key) => {
                if (key !== this.oldAnimParam.anim && key !== this.curAnimParam.anim) {
                    ani.setWeightForAllAnimatables(0);
                }
            });
        }
        // 给上一个动画降低权重 从1减到0
        if (this.oldAnimParam.weight > 0) {
            this.oldAnimParam.weight = BABYLON.Scalar.Clamp(this.oldAnimParam.weight - 0.05, 0, 1);
            const anim = this.meshContent.animationGroups[this.oldAnimParam.anim];
            anim.setWeightForAllAnimatables(this.oldAnimParam.weight);
            this.meshContent.animationGroups.forEach((ani, key) => {
                if (key !== this.oldAnimParam.anim && key !== this.curAnimParam.anim) {
                    ani.setWeightForAllAnimatables(0);
                }
            });
        }
    };

    private onCollision = (event: BABYLON.IPhysicsCollisionEvent) => {
        if (
            event.type === BABYLON.PhysicsEventType.COLLISION_STARTED &&
            this.jumpState.hasTask &&
            (event?.point?.y || 0) > this.player.position.y + 1.5
        ) {
            this.jumpState.hasTask = false;
            this.jumpState.jump = false;
            this.jumpState.fall = true;
            this.velocity.y = -9.8;
        }
    };

    private onMove() {
        const delta = parseInt(this.deltaTime);
        // 上楼梯
        if (
            this.staircaseState.task &&
            !this.jumpState.jump &&
            this.player.position.y - 1.8 < this.staircaseState.height &&
            this.iswsad
        ) {
            this.velocity.y = 9.8;
        }
        if (
            this.velocity.y &&
            this.staircaseState.task &&
            !this.staircaseRaycast.hasHit &&
            this.player.position.y - 1.8 >= this.staircaseState.height
        ) {
            this.velocity.y = -9.8;
            this.staircaseState.task = false;
        }
        // 跳起来
        if (this.jumpState.jump && !this.jumpState.hasTask && this.footRaycast.hasHit) {
            this.jumpState.hasTask = true;
            this.velocity.y = 9.8;
        }
        // 判定落下
        if (
            !this.footRaycast.hasHit &&
            this.player.position.y > this.jumpState.startHeight + this.jumpState.limit &&
            this.jumpState.jump
        ) {
            // 落下来
            this.jumpState.jump = false;
            this.jumpState.fall = true;
            this.velocity.y = -9.8;
        }
        // 走路
        if (this.iswsad && !this.jumpState.jump) {
            const dir = this.lookAtBox();
            let dd_x = (dir.x * delta) / 1;
            let dd_z = (dir.z * delta) / 1;
            if (this.fps > 65 && this.fps < 125) {
                dd_x = dir.x * delta * 2;
                dd_z = dir.z * delta * 2;
            }
            this.velocity.x = dd_x;
            this.velocity.z = dd_z;
            if (!this.wallkingSound.isPlaying) {
                this.wallkingSound.play();
            }
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        this.player?.physicsBody?.setLinearVelocity(this.velocity);
    }

    private inputKeyState = (code: string, input: boolean) => {
        this.inputMap[code] = input;
    };

    private updateState = (): void => {
        const { x, y, z } = this.player.position;
        const res = parseFloat(y.toPrecision(6)) - 1.789;
        const start = new BABYLON.Vector3(x, res, z);
        const end = new BABYLON.Vector3(x, res - 0.8, z);
        (this.physEngine as any).raycastToRef(start, end, this.footRaycast);

        const s_start = this.staircaseRay.origin.add(new BABYLON.Vector3(0, 0, 0.03));
        const s_end = s_start.add(new BABYLON.Vector3(0, -0.68, 0));
        (this.physEngine as any).raycastToRef(s_start, s_end, this.staircaseRaycast);

        if (this.inputMap['KeyW']) {
            this.playerDirection = PlayerDirection.Forward;
        }
        if (this.inputMap['KeyS']) {
            this.playerDirection = PlayerDirection.Backward;
        }
        if (this.inputMap['KeyD']) {
            this.playerDirection = PlayerDirection.Right;
        }
        if (this.inputMap['KeyA']) {
            this.playerDirection = PlayerDirection.Left;
        }
        if (this.inputMap['KeyW'] && this.inputMap['KeyD']) {
            this.playerDirection = PlayerDirection.RightForward;
        }
        if (this.inputMap['KeyW'] && this.inputMap['KeyA']) {
            this.playerDirection = PlayerDirection.LeftForward;
        }
        if (this.inputMap['KeyS'] && this.inputMap['KeyD']) {
            this.playerDirection = PlayerDirection.RightBackward;
        }
        if (this.inputMap['KeyS'] && this.inputMap['KeyA']) {
            this.playerDirection = PlayerDirection.LeftBackward;
        }
        if (
            this.inputMap['KeyW'] ||
            this.inputMap['KeyS'] ||
            this.inputMap['KeyA'] ||
            this.inputMap['KeyD']
        ) {
            this.iswsad = true;
            if (!this.jumpState.jump && this.footRaycast.hasHit) {
                // console.log('AnimationKey.Running');
                this.onAnimWeight(AnimationKey.Running);
            }
            if (this.staircaseRaycast.hasHit) {
                this.staircaseState.task = true;
                this.staircaseState.height = this.staircaseRaycast.hitPointWorld.y + 0;
            }
        }
        // 按下空格键并且当前没有跳起任务hasTask
        if (
            this.inputMap['Space'] &&
            !this.jumpState.jump &&
            !this.jumpState.hasTask &&
            this.footRaycast.hasHit
        ) {
            console.log('起跳');
            this.jumpState.jump = true;
            this.jumpState.startHeight = y + 0;
            this.onAnimWeight(AnimationKey.Falling);
        }

        if (this.footRaycast.hasHit && this.jumpState.fall && !this.jumpState.jump) {
            console.log('跳跃落下着地1');
            this.jumpState.fall = false;
            if (this.iswsad) {
                this.onAnimWeight(AnimationKey.Running);
            } else {
                this.onAnimWeight(AnimationKey.Idle);
            }
        }

        // 按下空格键只跳一次
        if (
            this.inputMap['Space'] !== undefined &&
            !this.inputMap['Space'] &&
            this.footRaycast.hasHit &&
            this.jumpState.hasTask
        ) {
            console.log('跳跃落下着地2');
            this.jumpState.hasTask = false;
        }

        // 跳下来的时候 并非 jumpState 跳跃掉下
        if (!this.jumpState.jump && !this.footRaycast.hasHit) {
            console.log('自由落下');
            this.onAnimWeight(AnimationKey.Falling);
        }

        // 跳下来的时候 并非 jumpState 跳跃掉下
        if (
            !this.jumpState.jump &&
            !this.jumpState.hasTask &&
            this.footRaycast.hasHit &&
            this.curAnimParam.anim !== AnimationKey.Idle &&
            !this.iswsad
        ) {
            console.log('自由着地', this.iswsad);
            if (this.iswsad) {
                this.onAnimWeight(AnimationKey.Running);
            } else {
                this.onAnimWeight(AnimationKey.Idle);
            }
        }

        this.onMove();
    };

    // 按键抬起
    private inputKeyUp = () => {
        if (
            !this.inputMap['KeyW'] &&
            !this.inputMap['KeyS'] &&
            !this.inputMap['KeyA'] &&
            !this.inputMap['KeyD']
        ) {
            this.iswsad = false;
            this.wallkingSound.pause();
            if (!this.jumpState.hasTask) {
                // console.log('AnimationKey.Idle');
                this.onAnimWeight(AnimationKey.Idle);
            }
            if (this.staircaseState.task) {
                this.staircaseState.task = false;
                this.velocity.y = -9.8;
            }
        }
        // if (!this.iswsad && this.footRaycast.hasHit) {
        //     this.playerState = PlayerState.Idle;
        //     this.onAnimWeight(AnimationKey.Idle);
        // }
    };

    private curAnimParam = {
        weight: 1,
        anim: AnimationKey.Idle,
    };
    private oldAnimParam = {
        weight: 0,
        anim: AnimationKey.Running,
    };

    private onAnimWeight(akey: number) {
        if (akey === this.curAnimParam.anim) return;
        this.oldAnimParam.weight = 1;
        this.oldAnimParam.anim = this.curAnimParam.anim;
        this.curAnimParam.weight = 0;
        this.curAnimParam.anim = akey;
    }

    // 根据键盘输入锁定辅助盒子朝向
    private lookAtBox() {
        const mesh = this.boxHelper;
        // mesh.position = this.player.position.clone();
        const cameraDirection = this.camera?.getForwardRay().direction;
        if (!cameraDirection) return BABYLON.Vector3.Zero();
        const d = new BABYLON.Vector3(cameraDirection.x, 0, cameraDirection.z);
        switch (this.playerDirection) {
            case PlayerDirection.Forward:
                mesh.lookAt(mesh.position.add(d), 0, 0, 0);
                break;
            case PlayerDirection.Backward:
                mesh.lookAt(
                    mesh.position.add(
                        new BABYLON.Vector3(-cameraDirection.x, 0, -cameraDirection.z)
                    ),
                    0,
                    0,
                    0
                );
                break;
            case PlayerDirection.Right:
                mesh.lookAt(mesh.position.add(d), Math.PI / 2);
                break;
            case PlayerDirection.Left:
                mesh.lookAt(mesh.position.add(d), -Math.PI / 2);
                break;
            case PlayerDirection.RightForward:
                mesh.lookAt(mesh.position.add(d), Math.PI / 4);
                break;
            case PlayerDirection.LeftForward:
                mesh.lookAt(mesh.position.add(d), -Math.PI / 4);
                break;
            case PlayerDirection.RightBackward:
                mesh.lookAt(mesh.position.add(d), Math.PI / 2 + Math.PI / 4);
                break;
            case PlayerDirection.LeftBackward:
                mesh.lookAt(mesh.position.add(d), -Math.PI + Math.PI / 4);
                break;
        }
        const dir = this.getBoxDirection();
        const rot = BABYLON.Quaternion.FromLookDirectionRH(dir, BABYLON.Vector3.Up());
        const [mesheRoot] = this.player.getChildMeshes();
        mesheRoot.rotationQuaternion =
            mesheRoot.rotationQuaternion || BABYLON.Quaternion.Identity();
        BABYLON.Quaternion.SlerpToRef(
            mesheRoot.rotationQuaternion,
            rot,
            0.1,
            mesheRoot.rotationQuaternion
        );
        return dir;
    }

    // 辅助盒子
    private boxHelper!: BABYLON.Mesh;
    // 获取辅助盒子朝向
    private getBoxDirection() {
        const forward = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(0, 0, 1),
            this.boxHelper.computeWorldMatrix(true)
        );
        const direction = forward.subtract(this.boxHelper.position);
        return direction;
    }

    private advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    private fpsTextBlock = new GUI.TextBlock();

    private fpsView() {
        this.fpsTextBlock.text = '';
        this.fpsTextBlock.fontSize = 13;
        this.fpsTextBlock.color = 'white';
        this.fpsTextBlock.paddingLeft = 10;
        this.fpsTextBlock.paddingBottom = 10;
        this.fpsTextBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.fpsTextBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.advancedTexture.addControl(this.fpsTextBlock);

        const tipsBlock = new GUI.TextBlock();
        tipsBlock.text = 'Press esc to cancel mouse lock';
        tipsBlock.fontSize = 13;
        tipsBlock.color = 'white';
        tipsBlock.paddingLeft = 10;
        tipsBlock.paddingBottom = 30;
        tipsBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        tipsBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.advancedTexture.addControl(tipsBlock);
    }

    private loadAsset(
        rootUrl: string,
        sceneFilename: string,
        callback?: (event: BABYLON.ISceneLoaderProgressEvent) => void
    ): Promise<BABYLON.AssetContainer> {
        return new Promise((resolve, reject) => {
            const tipsBlock = new GUI.TextBlock();
            tipsBlock.fontSize = 12;
            tipsBlock.color = 'white';
            tipsBlock.paddingRight = 10;
            tipsBlock.paddingBottom = 30;
            tipsBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            tipsBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.advancedTexture.addControl(tipsBlock);
            console.log(import.meta.env.BASE_URL + rootUrl);
            BABYLON.SceneLoader.LoadAssetContainer(
                import.meta.env.BASE_URL + rootUrl,
                sceneFilename,
                this.scene,
                (container) => {
                    resolve(container);
                    tipsBlock.dispose();
                },
                (evt) => {
                    callback && callback(evt);
                    tipsBlock.text = `${evt.total}/${evt.loaded} ${parseInt(
                        (evt.loaded / evt.total) * 100 + '%'
                    )}`;
                },
                () => {
                    reject(null);
                }
            );
        });
    }

    public dispose() {
        this.meshContent?.dispose();
        this.boxHelper?.dispose();
        this.fpsTextBlock?.dispose();
        this.advancedTexture?.dispose();
        this.player.dispose();

        const observable = this.aggregatePlayer.body.getCollisionObservable();
        observable.removeCallback(this.onCollision);
        this.aggregatePlayer.dispose();

        this.scene?.onBeforeRenderObservable.removeCallback(this.onBeforeRender);
        this.scene?.onBeforeAnimationsObservable.removeCallback(this.onBeforeAnimations);
        // this.actionManager.
    }
}

export enum PlayerState {
    Idle,
    Jump,
    Running,
    RunJump,
    Falling, // 掉落
    Climbing, // 攀爬
}

export enum PlayerDirection {
    Forward,
    RightForward,
    Right,
    RightBackward,
    Backward,
    LeftBackward,
    Left,
    LeftForward,
}

export enum AnimationKey {
    Climbing,
    Falling,
    Idle,
    Jump,
    Running,
}

export interface InputMap {
    [key: string]: boolean;
}
