<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen select-none motion-preset-fade">
    <Navbar />

    <div class="h-14"></div>

    <main class="flex items-start justify-center flex-grow min-h-[calc(100vh-2rem)]">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>