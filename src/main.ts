import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import {useAuthStore} from "./stores/authStore.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./components/pages/HomePage.vue')
    },
    {
      path: '/auth/callback',
      name: 'callback',
      component: () => import('./components/pages/HomePage.vue')
    },
  ]
})

const app = createApp(App)

app.use(router)
app.use(createPinia())
app.use(autoAnimatePlugin)
const authStore = useAuthStore()

app.provide('authStore', authStore)

app.mount('#app')
