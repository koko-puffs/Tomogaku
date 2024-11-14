<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/layout/Navbar.vue'
import {onMounted} from "vue";
import {useAuthStore} from "./stores/authStore.ts";

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.handleAuthRedirect()
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <NavBar />
    
    <main class="flex-grow">
      <RouterView />
    </main>
  </div>
</template>

<style lang="postcss">
.button {
  @apply border border-transparent select-none rounded-lg
  hover:bg-neutral-900 hover:border-neutral-800 transition-all duration-75
  active:hover:text-white active:hover:border-neutral-400 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-lighter {
  @apply border border-transparent select-none rounded-lg
  hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-75
  active:hover:text-white active:hover:border-neutral-300 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-cancel {
  @apply border border-transparent select-none rounded-lg
  hover:bg-red-900 hover:border-red-700 transition-all duration-75
  active:hover:text-white active:hover:border-red-200 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-accept {
  @apply border border-transparent select-none rounded-lg
  hover:bg-green-900 hover:border-green-700 transition-all duration-75
  active:hover:text-white active:hover:border-green-200 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-cancel-visible {
  @apply border bg-red-900 border-red-700 select-none rounded-lg
  hover:bg-red-800 hover:border-red-600 transition-all duration-75
  active:hover:text-white active:hover:border-red-200 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-accept-visible {
  @apply border bg-green-900 border-green-700 select-none rounded-lg
  hover:bg-green-800 hover:border-green-600 transition-all duration-75
  active:hover:text-white active:hover:border-green-200 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-lighter-visible {
  @apply border bg-neutral-800 border-neutral-700 select-none rounded-lg
  hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-75
  active:hover:text-white active:hover:border-neutral-200 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

.button-visible {
  @apply border bg-neutral-900 border-neutral-800 select-none rounded-lg
  hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-75
  active:hover:text-white active:hover:border-neutral-300 cursor-pointer
  flex items-center justify-center text-sm text-nowrap overflow-hidden;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0);
  border-radius: 4px;
  height: 4px;
  padding-top: 20px;
  padding-bottom: 20px;
  outline: none;
  transition: background 0.075s ease;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  margin-top: -6px;
  border-radius: 50%;
  background: #e5e5e5;
  cursor: pointer;
  transition: transform 0.075s ease, background 0.075s ease;
}

input[type="range"]::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #e5e5e5;
  cursor: pointer;
  transition: transform 0.075s ease, background 0.075s ease;
  border: none;
}

input[type="range"]:hover::-webkit-slider-thumb {
  transform: scale(1.2);
}

input[type="range"]:hover::-moz-range-thumb {
  transform: scale(1.2);
}

input[type="range"]:active::-webkit-slider-thumb {
  transform: scale(1.35);
  background: #ffffff;
}

input[type="range"]:active::-moz-range-thumb {
  transform: scale(1.35);
  background: #ffffff;
}

/* Styles for the seek bar */
input[type="range"]:not(.volume-slider)::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #e5e5e5 var(--seek-before-width), rgba(255, 255, 255, 0.12) 0);
  border-radius: 4px;
  height: 4px;
}

input[type="range"]:not(.volume-slider)::-moz-range-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 4px;
  height: 4px;
}

input[type="range"]:not(.volume-slider)::-moz-range-progress {
  background: #ffffff;
  border-radius: 4px;
  height: 4px;
}

/* Styles for the volume slider */
.volume-slider::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #e5e5e5 var(--volume-before-width), rgba(255, 255, 255, 0.12) 0);
  border-radius: 4px;
  height: 4px;
}

.volume-slider::-moz-range-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 4px;
  height: 4px;
}

.volume-slider::-moz-range-progress {
  background: #ffffff;
  border-radius: 4px;
  height: 4px;
}
</style>
