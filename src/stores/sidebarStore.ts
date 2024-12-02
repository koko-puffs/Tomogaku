import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isOpen: false,
    showBackButton: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
      this.updateScrollLock()
    },
    setShowBackButton(show: boolean) {
      this.showBackButton = show
    },
    close() {
      this.isOpen = false
      this.updateScrollLock()
    },
    updateScrollLock() {
      // Only lock scroll if sidebar is open AND we're on mobile
      if (this.isOpen && window.innerWidth < 768) { // 768px is Tailwind's md breakpoint
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }
  }
})

// Add resize listener
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const store = useSidebarStore()
    store.updateScrollLock()
  })
}