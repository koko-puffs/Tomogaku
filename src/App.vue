<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import { useSidebarStore } from './stores/sidebarStore'
import { ref } from 'vue'

const sidebarStore = useSidebarStore()
const touchStart = ref<number | null>(null)
const touchEnd = ref<number | null>(null)
const minSwipeDistance = 50 // minimum distance for swipe

const onTouchStart = (e: TouchEvent) => {
  touchStart.value = e.changedTouches[0].screenX
}

const onTouchEnd = (e: TouchEvent) => {
  touchEnd.value = e.changedTouches[0].screenX
  checkSwipeDirection()
}

const checkSwipeDirection = () => {
  if (!touchStart.value || !touchEnd.value) return
  
  const distance = touchEnd.value - touchStart.value
  
  // Only trigger for right swipes when sidebar is closed
  // or left swipes when sidebar is open
  if (Math.abs(distance) > minSwipeDistance) {
    if (distance > 0 && !sidebarStore.isOpen) {
      // Swipe right - open sidebar
      sidebarStore.toggle()
    } else if (distance < 0 && sidebarStore.isOpen) {
      // Swipe left - close sidebar
      sidebarStore.toggle()
    }
  }
  
  // Reset values
  touchStart.value = null
  touchEnd.value = null
}
</script>

<template>
  <div 
    class="flex flex-col min-h-screen select-none"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <Navbar />

    <div class="h-14"></div>

    <main class="flex items-start justify-center flex-grow min-h-[calc(100vh-2rem)] px-4">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>