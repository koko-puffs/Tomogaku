import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isOpen: false,
    showBackButton: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    setShowBackButton(show: boolean) {
      this.showBackButton = show
    }
  }
})