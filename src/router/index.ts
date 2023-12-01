import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior() {
        return { top: 0 };
    },
    routes: [
        {
            path: '/',
            name: 'Babylonjs',
            component: () => import('@/views/babylonjs.vue'),
            children: [],
        },
    ],
});
