<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import {onMounted} from "vue";
import {useAuthStore} from "./stores/authStore.ts";

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.handleAuthRedirect()
})
</script>

<template>
  <div class="flex flex-col min-h-screen select-none motion-preset-fade">
    <Navbar />

    <div class="h-14"></div>
    
    <main class="flex-grow bg-black">
      <RouterView />
    </main>
    
    <Footer />
  </div>
</template>