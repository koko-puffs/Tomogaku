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
    <div class="flex flex-shrink-0 items-center justify-between mx-auto select-none py-4 px-6 space-x-4 h-18">
      <!-- Left section -->
      <div class="flex-1 flex items-center justify-start">
        <router-link to="/" class="h-9 text-2xl font-bold hover:border-b border-neutral-200 mr-6">tomogaku</router-link>
        <router-link
            v-if="authStore.user"
            to="/dashboard"
            class="button w-24 h-10"
        >
          <span>Dashboard</span>
        </router-link>
        <router-link
            v-if="authStore.user"
            to="/discover"
            class="button w-24 h-10"
        >
          <span>Discover</span>
        </router-link>
      </div>

      <!-- Center section -->
      <div class="flex-1 flex items-center justify-center">
      </div>

      <!-- Right section -->
      <div class="flex-1 flex items-center justify-end space-x-2">
        <button
            v-if="!authStore.user"
            @click="handleDiscordSignIn"
            class="button-visible w-40 h-10"
            :class="{ 'button-accept-visible': authStore.loading }"
            :disabled="authStore.loading"
        >
          <span>Sign in with Discord</span>
        </button>
        <button
            v-else
            @click="handleLogout"
            class="button-visible w-20 h-10"
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