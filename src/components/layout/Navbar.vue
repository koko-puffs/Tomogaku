<script setup lang="ts">
import { useAuthStore } from '../../stores/authStore.ts'
import { useRouter, useRoute } from "vue-router";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import { ref, onMounted, onUnmounted } from 'vue'
import { UserCircle2, Settings, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Handle menu item clicks
const handleMenuClick = async (action: () => void) => {
  await action()
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  await authStore.logout()
  await router.push('/')
}

const handleDiscordSignIn = () => {
  authStore.signInWithDiscord()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800 bg-neutral-950">
    <div class="flex items-center justify-between flex-shrink-0 px-6 py-4 mx-auto space-x-4 h-14">
      <!-- Left section -->
      <div class="flex items-center justify-start flex-1">
        <router-link to="/" class="relative flex items-center h-10 mr-5 text-xl font-bold" style="top: -1px;"
          @click="scrollToTop">tomogaku
        </router-link>
        <router-link v-if="authStore.user" to="/learn" class="w-24 h-10 mr-2 text-sm"
          :class="route.path.startsWith('/learn') ? 'button-active' : 'button-visible'" @click="scrollToTop">Learn
        </router-link>
        <router-link v-if="authStore.user" to="/discover" class="w-24 h-10 mr-2 text-sm"
          :class="route.path.startsWith('/discover') ? 'button-active' : 'button-visible'" @click="scrollToTop">Discover
        </router-link>
      </div>

      <!-- Center section -->
      <div class="flex items-center justify-center flex-1">
      </div>

      <!-- Right section -->
      <div class="flex items-center justify-end flex-1 space-x-2">
        <button v-if="!authStore.user" @click="handleDiscordSignIn" class="w-40 h-10 text-sm button-accept-visible"
          :class="{ 'opacity-0': authStore.loading }" :disabled="authStore.loading">
          <span v-if="!authStore.loading">Sign in with Discord</span>
          <LoadingSpinner v-else />
        </button>

        <div v-else class="relative" ref="dropdownRef">
          <button @click.stop="toggleDropdown" class="flex items-center h-10 px-2 text-sm"
            :class="isDropdownOpen ? 'button-active' : 'button-visible'">
            <span class="pl-1 pr-2">
              {{
                (authStore.user?.user_metadata?.custom_claims?.global_name ?? '').length > 20
                  ? (authStore.user?.user_metadata?.custom_claims?.global_name ?? '').substring(0, 20) + '...'
                  : authStore.user?.user_metadata?.custom_claims?.global_name ?? 'User'
              }}
            </span>
            <img v-if="authStore.user?.user_metadata.avatar_url" :src="authStore.user.user_metadata.avatar_url"
              class="rounded-full w-7 h-7" alt="User avatar" />
            <UserCircle2 v-else :size="24" />
          </button>


          <div v-if="isDropdownOpen"
            class="absolute right-0 w-48 py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-x-in-[0%] motion-translate-y-in-[-5%] motion-opacity-in-[0%] motion-duration-[0.15s] motion-duration-[0.15s]/opacity">
            <router-link :to="{ name: 'userProfile', params: { id: authStore.user?.id } }" @click="closeDropdown"
              class="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <UserCircle2 :size="16" class="mr-2" />
              Profile
            </router-link>
            <router-link to="/settings" @click="closeDropdown"
              class="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <Settings :size="16" class="mr-2" />
              Settings
            </router-link>
            <button @click="() => handleMenuClick(handleLogout)"
              class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <LogOut :size="16" class="mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>