import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
    base: '/ergoudan',
    plugins: [vue()],
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
