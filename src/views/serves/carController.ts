import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class CarController {
    private scene!: BABYLON.Scene;
    private camera!: BABYLON.ArcRotateCamera;
    private chassisMesh!: BABYLON.Mesh;
    private cb!: any;
    constructor(_camera: BABYLON.ArcRotateCamera, _scene: BABYLON.Scene, _cb: any) {
        this.scene = _scene;
        this.camera = _camera;
        this.init();
        this.cb = _cb;
    }

    private init() {
        const chassisMesh = BABYLON.MeshBuilder.CreateBox('Chassis', {
            width: 2,
            height: 0.4,
            depth: 4.8,
        });
        this.chassisMesh = chassisMesh;

        chassisMesh.position.y = 5;
        // chassisMesh.visibility = 0;
        chassisMesh.rotationQuaternion = new BABYLON.Quaternion();
        chassisMesh.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);

        // const followCamera = new BABYLON.FollowCamera(
        //     'FollowCam',
        //     new BABYLON.Vector3(-20, 10, -20),
        //     this.scene
        // );
        // followCamera.heightOffset = 5;
        // followCamera.radius = 10;
        // followCamera.rotationOffset = 180;
        // followCamera.cameraAcceleration = 0.08;
        // followCamera.maxCameraSpeed = 90;
        // followCamera.lockedTarget = chassisMesh;
        // this.scene.activeCamera = followCamera;

        const chassisPhysicsShape = new BABYLON.PhysicsShapeConvexHull(chassisMesh, this.scene);

        const chassisPhysicsBody = new BABYLON.PhysicsBody(
            chassisMesh,
            BABYLON.PhysicsMotionType.DYNAMIC,
            false,
            this.scene
        );

        chassisPhysicsBody.shape = chassisPhysicsShape;
        chassisPhysicsBody.setMassProperties({
            centerOfMass: new BABYLON.Vector3(0, -1, 0),
        });
        chassisPhysicsShape.filterMembershipMask = 2;

        const wheelMesh = BABYLON.MeshBuilder.CreateCylinder('WheelMesh', {
            height: 0.3,
            diameter: 0.6,
        });
        // wheelMesh.visibility = 0;
        const wheelMeshes = [
            wheelMesh,
            wheelMesh.createInstance('1'),
            wheelMesh.createInstance('2'),
            wheelMesh.createInstance('3'),
        ];
        wheelMeshes.forEach((mesh) => {
            mesh.rotationQuaternion = new BABYLON.Quaternion();
        });

        const vehicle = new RaycastVehicle(chassisPhysicsBody, this.scene);
        vehicle.numberOfFramesToPredict = 60; // 如果在空中则预测未来向上方向的帧数
        vehicle.predictionRatio = 0.8; // [0-1]以多快的速度纠正未来方向的角速度。 0 = 禁用
        const wheelConfig: WheelConfig = {
            positionLocal: new BABYLON.Vector3(0.88, 0, -1.5), // 机箱上的本地连接点
            suspensionRestLength: 0.6, // 悬架完全减压时的静止长度
            suspensionForce: 15000, // 施加到悬架/弹簧的最大力
            suspensionDamping: 0.15, // [0-1]阻尼力，以悬架力的百分比表示
            suspensionAxisLocal: new BABYLON.Vector3(0, -1, 0), // 弹簧方向
            axleAxisLocal: new BABYLON.Vector3(1, 0, 0), // 轮子旋转的轴
            forwardAxisLocal: new BABYLON.Vector3(0, 0, 1), // 车轮前进方向
            sideForcePositionRatio: 0.1, // [0-1]0 = 车轮位置，1 = 连接点
            sideForce: 40, // 应用于反轮漂移的力
            radius: 0.2,
            rotationMultiplier: 0.1, // 轮子旋转的速度
        };

        vehicle.addWheel(new RaycastWheel(wheelConfig)); // 右边后轮

        wheelConfig.positionLocal.set(-0.88, 0, -1.5); // 左边后轮
        vehicle.addWheel(new RaycastWheel(wheelConfig));

        wheelConfig.positionLocal.set(-0.88, 0, 1.6);
        vehicle.addWheel(new RaycastWheel(wheelConfig)); // 左边前轮

        wheelConfig.positionLocal.set(0.88, 0, 1.6);
        vehicle.addWheel(new RaycastWheel(wheelConfig)); // 右边前轮

        // 尝试一些抗滚动
        vehicle.addAntiRollAxle({ wheelA: 0, wheelB: 1, force: 10000 }); // 右后 - 左后
        vehicle.addAntiRollAxle({ wheelA: 2, wheelB: 3, force: 10000 }); // 右前 - 左后

        const controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (!this.isStarted) return;
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.code === 'KeyW') controls.forward = true;
                    if (kbInfo.event.code === 'KeyS') controls.backward = true;
                    if (kbInfo.event.code === 'KeyA') controls.left = true;
                    if (kbInfo.event.code === 'KeyD') controls.right = true;
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    if (kbInfo.event.code === 'KeyW') controls.forward = false;
                    if (kbInfo.event.code === 'KeyS') controls.backward = false;
                    if (kbInfo.event.code === 'KeyA') controls.left = false;
                    if (kbInfo.event.code === 'KeyD') controls.right = false;
                    break;
            }
        });

        const maxVehicleForce = 2200;
        const maxSteerValue = 0.6;
        const steeringIncrement = 0.005;
        const steerRecover = 0.05;
        let forwardForce = 0;
        let steerValue = 0;
        let steerDirection = 0;
        this.scene.onBeforeRenderObservable.add(() => {
            // console.log(this.camera.position);
            forwardForce = 0;
            steerDirection = 0;
            if (controls.forward) {
                forwardForce = 4;
            }
            if (controls.backward) {
                forwardForce = -4;
            }
            if (controls.left) {
                steerDirection = -1;
            }
            if (controls.right) {
                steerDirection = 1;
            }

            steerValue += steerDirection * steeringIncrement;
            steerValue = Math.min(Math.max(steerValue, -maxSteerValue), maxSteerValue);
            steerValue *= 1 - (1 - Math.abs(steerDirection)) * steerRecover;
            vehicle.wheels[2].steering = steerValue;
            vehicle.wheels[3].steering = steerValue;
            vehicle.wheels[2].force = forwardForce * maxVehicleForce;
            vehicle.wheels[3].force = forwardForce * maxVehicleForce;

            vehicle.wheels.forEach((wheel, index) => {
                if (!wheelMeshes[index]) return;
                const wheelMesh = wheelMeshes[index];
                wheelMesh.position.copyFrom(wheel.transform.position);
                wheelMesh?.rotationQuaternion?.copyFrom(
                    wheel.transform.rotationQuaternion || BABYLON.Quaternion.Zero()
                );
                wheelMesh.rotate(BABYLON.Axis.Z, Math.PI / 2, BABYLON.Space.LOCAL);
            });
        });
        this.gui();
    }

    public button!: GUI.Button;

    public gui() {
        // GUI
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
        const button = GUI.Button.CreateSimpleButton('aa', '驾驶');
        button.width = '120px';
        button.height = '36px';
        button.color = 'white';
        button.cornerRadius = 20;
        button.background = 'green';
        button.onPointerUpObservable.add(this.start);
        advancedTexture.addControl(button);
        button.isVisible = false;
        this.button = button;
    }

    public isStarted = false;

    public start = () => {
        this.camera.setTarget(this.chassisMesh);
        this.isStarted = true;
        this.button.isVisible = false;
        this.cb && this.cb();
    };

    public end = () => {
        this.isStarted = false;
    };
}

const tmp1 = new BABYLON.Vector3();
const tmp2 = new BABYLON.Vector3();
const tmpq1 = new BABYLON.Quaternion();
const upAxisLocal = new BABYLON.Vector3(0, 1, 0);
const rightAxisLocal = new BABYLON.Vector3(1, 0, 0);
const forwardAxisLocal = BABYLON.Vector3.Cross(upAxisLocal, rightAxisLocal);
forwardAxisLocal.normalize();
rightAxisLocal.normalize();

const raycastResult = new BABYLON.PhysicsRaycastResult();

class RaycastVehicle {
    public body: BABYLON.PhysicsBody;
    public wheels: RaycastWheel[];
    public antiRollAxles: Axle[];

    public scene: BABYLON.Scene;
    public physicsEngine: any;
    public numberOfFramesToPredict: number;
    public predictionRatio: number;
    public nWheelsOnGround: number;
    public speed: number;

    constructor(body: BABYLON.PhysicsBody, scene: BABYLON.Scene) {
        this.body = body;
        this.scene = scene;
        this.physicsEngine = scene.getPhysicsEngine();
        this.wheels = [];
        this.numberOfFramesToPredict = 60;
        this.predictionRatio = 0.6;
        this.nWheelsOnGround = 0;
        this.speed = 0;
        this.antiRollAxles = [];
    }

    addWheel(wheel: RaycastWheel) {
        this.wheels.push(wheel);
    }

    removeWheel(wheel: RaycastWheel, index: number) {
        if (index) this.wheels.splice(index, 1);
        this.wheels.splice(this.wheels.indexOf(wheel), 1);
    }

    addAntiRollAxle(axle: Axle) {
        this.antiRollAxles.push(axle);
    }

    removeAntiRollAxle(axle: Axle, index: number) {
        if (index) this.antiRollAxles.splice(index, 1);
        this.antiRollAxles.splice(this.antiRollAxles.indexOf(axle), 1);
    }

    updateWheelTransform(wheel: RaycastWheel) {
        BABYLON.Vector3.TransformCoordinatesToRef(
            wheel.positionLocal,
            this.body.transformNode.getWorldMatrix(),
            wheel.positionWorld
        );
        BABYLON.Vector3.TransformNormalToRef(
            wheel.suspensionAxisLocal,
            this.body.transformNode.getWorldMatrix(),
            wheel.suspensionAxisWorld
        );
    }

    updateVehicleSpeed() {
        BABYLON.Vector3.TransformNormalToRef(
            this.body.getLinearVelocity(),
            this.body.transformNode.getWorldMatrix().clone().invert(),
            tmp1
        );
        this.speed = tmp1.z;
    }

    updateWheelSteering(wheel: RaycastWheel) {
        BABYLON.Quaternion.RotationAxisToRef(
            wheel.suspensionAxisLocal.negateToRef(tmp1),
            wheel.steering,
            tmpq1
        );
        this.body?.transformNode?.rotationQuaternion?.multiplyToRef(
            tmpq1,
            wheel.transform.rotationQuaternion || BABYLON.Quaternion.Zero()
        );
        wheel.transform?.rotationQuaternion?.normalize();
        wheel.transform.computeWorldMatrix(true);
    }

    updateWheelRaycast(wheel: RaycastWheel) {
        tmp1.copyFrom(wheel.suspensionAxisWorld)
            .scaleInPlace(wheel.suspensionRestLength)
            .addInPlace(wheel.positionWorld);
        const rayStart = wheel.positionWorld;
        const rayEnd = tmp1;
        this.physicsEngine.raycastToRef(rayStart, rayEnd, raycastResult);
        if (!raycastResult.hasHit) {
            wheel.inContact = false;
            return;
        }
        wheel.hitPoint.copyFrom(raycastResult.hitPointWorld);
        wheel.hitNormal.copyFrom(raycastResult.hitNormalWorld);
        wheel.hitDistance = raycastResult.hitDistance;
        wheel.inContact = true;
        this.nWheelsOnGround++;
    }

    updateWheelSuspension(wheel: RaycastWheel) {
        if (!wheel.inContact) {
            wheel.prevSuspensionLength = wheel.suspensionLength;
            wheel.hitDistance = wheel.suspensionRestLength;
            return;
        }

        let force = 0.0;
        wheel.suspensionLength = wheel.suspensionRestLength - wheel.hitDistance;
        wheel.suspensionLength = clampNumber(wheel.suspensionLength, 0, wheel.suspensionRestLength);
        const compressionRatio = wheel.suspensionLength / wheel.suspensionRestLength;

        const compressionForce = wheel.suspensionForce * compressionRatio;
        force += compressionForce;

        const rate =
            (wheel.prevSuspensionLength - wheel.suspensionLength) /
            this.physicsEngine.getTimeStep();
        wheel.prevSuspensionLength = wheel.suspensionLength;

        const dampingForce = rate * wheel.suspensionForce * wheel.suspensionDamping;
        force -= dampingForce;

        const suspensionForce = BABYLON.Vector3.TransformNormalToRef(
            wheel.suspensionAxisLocal.negateToRef(tmp1),
            this.body.transformNode.getWorldMatrix(),
            tmp1
        ).scaleInPlace(force);

        this.body.applyForce(suspensionForce, wheel.hitPoint);
    }

    updateWheelSideForce(wheel: RaycastWheel) {
        if (!wheel.inContact) return;
        const tireWorldVel = getBodyVelocityAtPoint(this.body, wheel.positionWorld);
        const steeringDir = BABYLON.Vector3.TransformNormalToRef(
            wheel.axleAxisLocal,
            wheel.transform.getWorldMatrix(),
            tmp1
        );
        const steeringVel = BABYLON.Vector3.Dot(steeringDir, tireWorldVel);
        const desiredVelChange = -steeringVel;
        const desiredAccel = desiredVelChange / this.physicsEngine.getTimeStep();
        this.body.applyForce(
            steeringDir.scaleInPlace(wheel.sideForce * desiredAccel),
            BABYLON.Vector3.LerpToRef(
                wheel.hitPoint,
                wheel.positionWorld,
                wheel.sideForcePositionRatio,
                tmp2
            )
        );
    }

    updateWheelForce(wheel: RaycastWheel) {
        if (!wheel.inContact) return;
        if (wheel.force !== 0) {
            const forwardDirectionWorld = BABYLON.Vector3.TransformNormalToRef(
                wheel.forwardAxisLocal,
                wheel.transform.getWorldMatrix(),
                tmp1
            ).scaleInPlace(wheel.force);
            this.body.applyForce(forwardDirectionWorld, tmp2.copyFrom(wheel.hitPoint));
        }
    }

    updateWheelRotation(wheel: RaycastWheel) {
        wheel.rotation += this.speed * wheel.rotationMultiplier * wheel.radius;
        BABYLON.Quaternion.RotationAxisToRef(wheel.axleAxisLocal, wheel.rotation, tmpq1);
        wheel.transform.rotationQuaternion?.multiplyToRef(
            tmpq1,
            wheel.transform.rotationQuaternion
        );
        // console.log(tmpq1);
        wheel.transform.rotationQuaternion?.normalize();
    }

    updateWheelTransformPosition(wheel: RaycastWheel) {
        wheel.transform.position.copyFrom(wheel.positionWorld);
        wheel.transform.position.addInPlace(
            wheel.suspensionAxisWorld.scale(wheel.hitDistance - wheel.radius)
        );
    }

    updateVehiclePredictiveLanding() {
        if (this.nWheelsOnGround > 0) return;
        const position = this.body.transformNode.position;
        const gravity = tmp1
            .copyFrom(this.physicsEngine.gravity)
            .scaleInPlace(this.body.getGravityFactor());
        const frameTime = this.physicsEngine.getTimeStep();
        const predictTime = this.numberOfFramesToPredict * frameTime;

        const predictedPosition = tmp2;
        predictedPosition.copyFrom(this.body.getLinearVelocity()).scaleInPlace(predictTime);
        predictedPosition.addInPlace(gravity.scaleInPlace(0.5 * predictTime * predictTime));
        predictedPosition.addInPlace(this.body.transformNode.position);

        this.physicsEngine.raycastToRef(position, predictedPosition, raycastResult);

        if (raycastResult.hasHit) {
            const velocity = this.body.getLinearVelocity().normalize();
            const direction = raycastResult.hitPointWorld.subtractToRef(position, tmp1);
            const displacement = tmp2;
            displacement.x = velocity.x === 0 ? 0 : direction.x / velocity.x;
            displacement.y = velocity.y === 0 ? 0 : direction.y / velocity.y;
            displacement.z = velocity.z === 0 ? 0 : direction.z / velocity.z;
            const nFrames = displacement.length();
            const R1 = BABYLON.Vector3.TransformNormalToRef(
                BABYLON.Axis.Y,
                this.body.transformNode.getWorldMatrix(),
                tmp1
            );
            const R2 = raycastResult.hitNormalWorld;
            const rotationDifference = BABYLON.Vector3.CrossToRef(R1, R2, tmp2);
            const timeStepDuration = frameTime * nFrames;
            const predictedAngularVelocity = rotationDifference.scaleToRef(
                1 / timeStepDuration,
                tmp2
            );

            this.body.setAngularVelocity(
                BABYLON.Vector3.LerpToRef(
                    this.body.getAngularVelocity(),
                    predictedAngularVelocity,
                    this.predictionRatio,
                    tmp1
                )
            );
        }
    }

    update() {
        this.body.transformNode.computeWorldMatrix(true);
        this.nWheelsOnGround = 0;
        this.updateVehicleSpeed();

        this.wheels.forEach((wheel) => {
            this.updateWheelTransform(wheel);
            this.updateWheelSteering(wheel);
            this.updateWheelRaycast(wheel);
            this.updateWheelSuspension(wheel);
            this.updateWheelForce(wheel);
            this.updateWheelSideForce(wheel);
            this.updateWheelTransformPosition(wheel);
            this.updateWheelRotation(wheel);
        });

        this.updateVehiclePredictiveLanding();

        this.antiRollAxles.forEach((axle) => {
            const wheelA = this.wheels[axle.wheelA];
            const wheelB = this.wheels[axle.wheelB];
            if (!wheelA || !wheelB) return;
            if (!wheelA.inContact && !wheelB.inContact) return;
            const wheelOrder =
                wheelA.suspensionLength <= wheelB.suspensionLength
                    ? [wheelA, wheelB]
                    : [wheelB, wheelA];
            const maxCompressionRestLength =
                (wheelA.suspensionRestLength + wheelB.suspensionRestLength) / 2;
            const compressionDifference =
                wheelOrder[1].suspensionLength - wheelOrder[0].suspensionLength;
            const compressionRatio =
                Math.min(compressionDifference, maxCompressionRestLength) /
                maxCompressionRestLength;

            const antiRollForce = tmp1
                .copyFrom(wheelOrder[0].suspensionAxisWorld)
                .scaleInPlace(axle.force * compressionRatio);
            this.body.applyForce(antiRollForce, wheelOrder[0].positionWorld);
            antiRollForce
                .copyFrom(wheelOrder[1].suspensionAxisWorld)
                .negateInPlace()
                .scaleInPlace(axle.force * compressionRatio);
            this.body.applyForce(antiRollForce, wheelOrder[1].positionWorld);
        });
    }
}

class RaycastWheel {
    public positionLocal: BABYLON.Vector3;
    public positionWorld: BABYLON.Vector3;
    public suspensionAxisLocal: BABYLON.Vector3;
    public suspensionAxisWorld: BABYLON.Vector3;
    public axleAxisLocal: BABYLON.Vector3;
    public forwardAxisLocal: BABYLON.Vector3;

    public sideForce: number;
    public sideForcePositionRatio: number;
    public radius: number;
    public suspensionRestLength: number;
    public prevSuspensionLength: number;
    public suspensionLength: number;
    public suspensionForce: number;
    public suspensionDamping: number;
    public rotationMultiplier: number;
    public hitDistance: number;
    public hitNormal: BABYLON.Vector3;
    public hitPoint: BABYLON.Vector3;
    public inContact: boolean;
    public steering: number;
    public rotation: number;
    public force: number;

    public transform!: BABYLON.TransformNode;

    constructor(options: WheelConfig) {
        this.positionLocal = options.positionLocal.clone();
        this.positionWorld = options.positionLocal.clone();
        this.suspensionAxisLocal = options.suspensionAxisLocal.clone();
        this.suspensionAxisWorld = options.suspensionAxisLocal.clone();
        this.axleAxisLocal = options.axleAxisLocal.clone();

        this.forwardAxisLocal = options.forwardAxisLocal.clone();

        this.sideForce = options.sideForce;
        this.sideForcePositionRatio = options.sideForcePositionRatio;
        this.radius = options.radius;
        this.suspensionRestLength = options.suspensionRestLength;
        this.prevSuspensionLength = this.suspensionRestLength;
        this.suspensionLength = this.suspensionRestLength;
        this.suspensionForce = options.suspensionForce;
        this.suspensionDamping = options.suspensionDamping;
        this.rotationMultiplier = options.rotationMultiplier;
        this.hitDistance = 0;
        this.hitNormal = new BABYLON.Vector3();
        this.hitPoint = new BABYLON.Vector3();
        this.inContact = false;
        this.steering = 0;
        this.rotation = 0;
        this.force = 0;

        this.transform = new BABYLON.TransformNode('WheelTransform');
        this.transform.rotationQuaternion = new BABYLON.Quaternion();
    }
}

const getBodyVelocityAtPoint = (body: BABYLON.PhysicsBody, point: BABYLON.Vector3) => {
    const r = point.subtract(body.transformNode.position);
    const angularVelocity = body.getAngularVelocity();
    BABYLON.Vector3.Cross(angularVelocity, r);
    const res = BABYLON.Vector3.Cross(angularVelocity, r);
    const velocity = body.getLinearVelocity();
    res.addInPlace(velocity);
    return res;
};

const clampNumber = (num: number, a: number, b: number) =>
    Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

interface WheelConfig {
    positionLocal: BABYLON.Vector3; // 机箱上的本地连接点
    suspensionRestLength: number; // 悬架完全减压时的静止长度
    suspensionForce: number; // 施加到悬架/弹簧的最大力
    suspensionDamping: number; // [0-1]阻尼力，以悬架力的百分比表示
    suspensionAxisLocal: BABYLON.Vector3; // 弹簧方向
    axleAxisLocal: BABYLON.Vector3; // 轮子旋转的轴
    forwardAxisLocal: BABYLON.Vector3; // 车轮前进方向
    sideForcePositionRatio: number; // [0-1]0 = 车轮位置，1 = 连接点
    sideForce: number; // 应用于反轮漂移的力
    radius: number;
    rotationMultiplier: number; // 轮子旋转的速度
}

interface Axle {
    wheelA: number;
    wheelB: number;
    force: number;
}

export enum CarAnimationKey {
    car_idle, // 汽车空闲，
    car_slowdrive, // 汽车慢速行驶，
    car_slowdrive_leftturn, // 汽车慢速左转，
    car_slowdrive_rightturn, // 汽车慢速右转，
    car_drive, // 汽车驾驶
    car_drive_rightturn, // 汽车右转行驶，
    car_drive_leftturn, // 汽车左转行驶，
    car_racedrive, // 汽车比赛，
    car_racedrive_leftturn, // 赛车左转，
    car_racedrive_rightturn, // 赛车右转，
    car_drift_left, // 汽车向左漂移，
    car_drift_right, // 汽车向右漂移，
    car_rev, // 汽车转速
}
