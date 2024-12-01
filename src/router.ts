import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/authStore";

// Add a title mapping object (you can place this before router creation)
const titleMap: Record<string, string> = {
  landing: "tomogaku",
  learn: "Learn / tomogaku",
  cards: "Learn / tomogaku",
  discover: "Discover / tomogaku",
  userProfile: "Profile / tomogaku",
  deck: "Deck / tomogaku",
  feed: "Feed / tomogaku",
  terms: "Terms / tomogaku",
  privacy: "Privacy / tomogaku",
  notFound: "404 / tomogaku",
};

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
      component: () => import("./views/learn/Learn.vue"),
      meta: { requiresAuth: true },
      props: true,
      children: [
        {
          path: "cards/:cardId?",
          name: "cards",
          component: () => import("./views/learn/Cards.vue"),
          meta: { requiresAuth: true },
          props: true,
        }
      ]
    },
    {
      path: "/discover",
      name: "discover",
      component: () => import("./views/discover/Discover.vue"),
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
      path: "/discover/user/:id?",
      name: "userProfile", 
      component: () => import("./views/discover/UserProfile.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/discover/deck/:id?",
      name: "deck",
      component: () => import("./views/discover/PublicDeck.vue"),
      props: true,
    },
    {
      path: "/feed",
      name: "feed",
      component: () => import("./views/feed/Feed.vue"),
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

  // Set the document title
  document.title = titleMap[to.name as string] || "tomogaku";

  // Wait for auth check to complete
  if (!authStore.initialized) {
    await authStore.handleAuthRedirect();
  }

  // Allow access to notFound page and public deck pages
  if (to.name === 'notFound' || to.path.startsWith('/discover/deck/')) {
    next();
    return;
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