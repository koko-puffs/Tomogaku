import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/authStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "landing",
      component: () => import("./views/Landing.vue"),
    },
    {
      path: "/auth/callback",
      name: "callback",
      component: () => import("./views/Landing.vue"),
    },
    {
      path: "/learn/:deckId?",
      name: "learn",
      component: () => import("./views/Learn.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/discover",
      name: "discover",
      component: () => import("./views/Discover.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/terms",
      name: "terms",
      component: () => import("./views/Terms.vue"),
    },
    {
      path: "/privacy",
      name: "privacy",
      component: () => import("./views/Privacy.vue"),
    },
    {
      path: "/discover/user/:id",
      name: "userProfile", 
      component: () => import("./views/UserProfile.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/discover/deck/:id",
      name: "deck",
      component: () => import("./views/Deck.vue"),
      props: true,
    },
    {
      path: "/feed",
      name: "feed",
      component: () => import("./views/Feed.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("./views/NotFound.vue"),
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const publicPaths = ['/', '/terms', '/privacy', '/contact'];

  // Wait for auth check to complete
  if (!authStore.initialized) {
    await authStore.handleAuthRedirect();
  }

  // Check if path is public or user is authenticated
  if (!authStore.user && !publicPaths.includes(to.path)) {
    next('/');
  } else if (authStore.user && to.path === '/') {
    next('/learn');
  } else {
    next();
  }
});

export default router;