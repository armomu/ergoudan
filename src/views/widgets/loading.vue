<template>
    <div v-if="store.visible" class="loading_full">
        <div class="content">
            <div
                class="pct"
                :class="{
                    s: store.pct >= 100,
                }"
            >
                {{ store.pct }}
            </div>
        </div>
        <div class="b">
            made with by <a href="https://github.com/armomu" target="_blank">armomu</a>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useLoading } from './loading';
const store = useLoading();
</script>
<style lang="scss">
.loading_full {
    height: 100vh;
    width: 100vw;
    position: absolute;
    background: #fff;
    left: 0;
    top: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    .content {
        text-align: center;
    }
    .title {
        font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
        font-size: 100px;
        background: linear-gradient(90deg, #fcaa36, #a57c84, #f64f59);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 10px;
        position: relative;
        margin-top: -100px;
    }
    .desc {
        font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode',
            Geneva, Verdana, sans-serif;
        font-size: 26px;
        position: relative;
        color: #666;
    }
    .pct {
        display: inline-block;
        width: 200px;
        height: 200px;
        position: relative;
        border-radius: 50%;
        text-align: center;
        line-height: 200px;
        font-size: 60px;
        transition: all 0.3s;
        color: #666;
        margin-top: 20px;
        &::before {
            content: '';
            position: absolute;
            top: 6px;
            left: 6px;
            right: 6px;
            bottom: 6px;
            background: #fff;
            border-radius: 50%;
            z-index: -1;
        }
        &::after {
            content: '';
            position: absolute;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            background: linear-gradient(45deg, transparent, transparent 40%, #fcaa36);
            border-radius: 50%;
            z-index: -2;
            animation: animate 2s linear infinite;
            filter: blur(10px);
        }
    }
    .pct.s {
        cursor: pointer;
        scale: 1.05;
        &::after {
            animation: none;
            opacity: 0;
        }
    }
    @keyframes animate {
        0% {
            transform: rotate(0deg);
            filter: hue-rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
            filter: hue-rotate(360deg);
        }
    }

    .b {
        position: absolute;
        left: 50%;
        bottom: 10px;
        margin-left: -77px;
        a {
            color: #fcaa36;
        }
    }
}
</style>
