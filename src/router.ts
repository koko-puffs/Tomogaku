import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('./views/Landing.vue')
    },
    {
      path: '/auth/callback',
      name: 'callback',
      component: () => import('./views/Landing.vue')
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('./views/Learn.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('./views/Discover.vue'),
      meta: { requiresAuth: true }
    },
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth check to complete
  if (!authStore.initialized) {
    await authStore.handleAuthRedirect()
  }
  
  // Now make routing decisions with initialized auth state
  if (to.meta.requiresAuth && !authStore.user) {
    next('/')
  }
  else if (authStore.user && to.path === '/') {
    next('/learn')
  }
  else {
    next()
  }
})

export default router