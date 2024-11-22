import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  // Initialize theme from localStorage or system preference
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    updateTheme()
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  const updateTheme = () => {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return {
    isDark,
    toggleTheme,
    initializeTheme
  }
})