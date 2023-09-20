import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
    base: '/babylonjs-character-generator',
    plugins: [vue(), vuetify() as any, vueJsx()],
    server: {
        open: false,
        host: '0.0.0.0',
        port: 8086,
    },
    optimizeDeps: {
        exclude: ['@babylonjs/havok'],
    },
    assetsInclude: ['**/*.gltf', '**/*.glb'],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
