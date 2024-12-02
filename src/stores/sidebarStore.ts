import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isOpen: false,
    showBackButton: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
      if (this.isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    },
    setShowBackButton(show: boolean) {
      this.showBackButton = show
    }
  }
})