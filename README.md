# Ergoudan

### This is a simple Havok physics character controller demo using Babylon.js 6、7

原理很简单，使用 Havok 物理线性移动控制角色

The principle is very simple, use havok physics to move the character linearly, Control character using WSAD and space keys

## Screenshot

<img width="50%" src="https://github.com/armomu/ergoudan/raw/master/public/094246.png">

## Online Demo 

[https://armomu.github.io/ergoudan/](https://armomu.github.io/ergoudan/)

[https://daisy-kaliman.vercel.app/#/index](https://daisy-kaliman.vercel.app/#/index)

## Use it

#### Clone the project and run it directly locally

```
git clone https://github.com/armomu/ergoudan.git

cd ergoudan

pnpm install

pnpm run dev
```

#### Use in your project

Copy `src/views/serves/thirdPersonController.ts` and `public/textures/x-bot.glb` to your project directory

Change

```typescript
// thirdPersonController.ts
// 503 line

/**
 * Load a scene into an asset container
 * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
 * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
 * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
 * @param onSuccess a callback with the scene when import succeeds
 * @param onProgress a callback with a progress event for each file being loaded
 * @param onError a callback with the scene, a message, and possibly an exception when import fails
 * @param pluginExtension the extension used to determine the plugin
 * @param name defines the filename, if the data is binary
 * @returns The loaded plugin
 */
BABYLON.SceneLoader.LoadAssetContainer(
    import.meta.env.BASE_URL + rootUrl, // Output /ergoudan/textures/ Change to your directory
    sceneFilename // Output x-bot.glb
);
```

Use

```typescript
import { ThirdPersonController } from './thirdPersonController';

new ThirdPersonController(camera, scene);
```

## Parameter

> package.json dependencies `@babylonjs/havok: 1.1.4` Required

```typescript

export class ThirdPersonController {
    /**
     * Creates a new ThirdPersonController
     * @param camera Required BABYLON.ArcRotateCamera
     * @param scene Required BABYLON.Scene
     */
    constructor(camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene) {
    }

}

```

| Methods                         | desc                    |
| ------------------------------- | ----------------------- |
| dispose() | Destroy the current character controller |

## TODO

-   ✅ Havok Physics engine
-   ✅ Contrl character using WASD
-   ✅ Jump
-   ✅ Climb stairs
-   ✅ Uphill and downhill
-   ❌ First person control
-   ❌ Mobile device
-   ❌ Npm package
