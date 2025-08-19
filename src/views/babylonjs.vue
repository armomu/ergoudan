<template>
    <div class="babylon">
        <canvas id="canvas" ref="canvasDom"></canvas>
    </div>
</template>
<script setup lang="ts">
import { onMounted, shallowRef, onBeforeUnmount } from 'vue';
import { BabylonScene } from './serves/main';
const canvasDom = shallowRef<HTMLCanvasElement>();

let playerApp: BabylonScene;
onMounted(() => {
    playerApp = new BabylonScene(canvasDom.value!);
});
onBeforeUnmount(() => {
    playerApp.dispose();
});
</script>
<style scoped lang="scss">
.babylon {
    position: relative;
    height: 100vh;
}

#canvas {
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>
