<script setup lang="ts">
import { useAuthStore } from '../../stores/authStore.ts'
import {useRouter} from "vue-router";
import LoadingSpinner from "../common/LoadingSpinner.vue";

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  await router.push('/')
}

const handleDiscordSignIn = () => {
  authStore.signInWithDiscord()
}
</script>

<template>
  <nav>
    <div class="flex items-center justify-between flex-shrink-0 px-6 py-4 mx-auto space-x-4 select-none h-18">
      <!-- Left section -->
      <div class="flex items-center justify-start flex-1">
        <router-link to="/" class="mr-6 text-2xl font-bold h-9 hover:border-b border-neutral-200">tomogaku</router-link>
        <router-link
            v-if="authStore.user"
            to="/dashboard"
            class="w-24 h-10 button"
        >
          <span>Dashboard</span>
        </router-link>
        <router-link
            v-if="authStore.user"
            to="/discover"
            class="w-24 h-10 button"
        >
          <span>Discover</span>
        </router-link>
      </div>

      <!-- Center section -->
      <div class="flex items-center justify-center flex-1">
      </div>

      <!-- Right section -->
      <div class="flex items-center justify-end flex-1 space-x-2">
        <button
            v-if="!authStore.user"
            @click="handleDiscordSignIn"
            class="w-40 h-10 button-visible"
            :class="{ 'button-accept-visible': authStore.loading }"
            :disabled="authStore.loading"
        >
          <span>Sign in with Discord</span>
        </button>
        <button
            v-else
            @click="handleLogout"
            class="w-20 h-10 button-visible"
            :class="{ 'button-visible': authStore.loading }"
            :disabled="authStore.loading"
        >
          <span v-if="!authStore.loading">Logout</span>
          <LoadingSpinner v-else />
        </button>
      </div>
    </div>
  </nav>
</template>