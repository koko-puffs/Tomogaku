<script setup lang="ts">
import { useAuthStore } from '../../stores/authStore.ts'
import { useRoute } from "vue-router";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import SettingsModal from '../features/settings/SettingsModal.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { UserCircle2, Settings, LogOut, BookOpen, Compass, Activity } from 'lucide-vue-next'

const authStore = useAuthStore()
//const router = useRouter()
const route = useRoute()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const settingsModalRef = ref<InstanceType<typeof SettingsModal> | null>(null)

const openSettings = () => {
  settingsModalRef.value?.openModal()
  closeDropdown()
}

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
  //await router.push('/')
  window.location.reload()
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
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800 bg-neutral-950/75 backdrop-blur-md">
    <div class="flex items-center justify-between flex-shrink-0 px-6 mx-auto space-x-4 h-14">
      <!-- Left section -->
      <div class="flex items-center justify-start flex-1">
        <router-link to="/" class="relative flex items-center h-10 text-xl font-bold" style="top: -1px;"
          @click="scrollToTop">
          <span class="mt-1 sm:hidden">共学</span>
          <span class="hidden sm:inline">tomogaku</span>
        </router-link>
      </div>

      <!-- Center section -->
      <div class="flex items-center justify-center flex-1 space-x-2">
        <router-link v-if="authStore.user" to="/learn"
          class="relative px-4 text-sm transition-all duration-150 h-14 group"
          :class="route.path.startsWith('/learn') ? 'text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-500/10'"
          @click="scrollToTop">
          <span class="flex items-center justify-center h-full mt-px">
            <BookOpen :size="16" class="md:mr-2" />
            <span class="hidden md:inline">Learn</span>
          </span>
          <div v-if="route.path.startsWith('/learn')"
            class="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full"></div>
          <div v-else
            class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white rounded-full transition-all duration-150 group-hover:w-full -translate-x-1/2">
          </div>
        </router-link>
        <router-link v-if="authStore.user" to="/discover"
          class="relative px-4 text-sm transition-all duration-150 h-14 group"
          :class="route.path.startsWith('/discover') ? 'text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-500/10'"
          @click="scrollToTop">
          <span class="flex items-center justify-center h-full mt-px">
            <Compass :size="16" class="md:mr-2" />
            <span class="hidden md:inline">Discover</span>
          </span>
          <div v-if="route.path.startsWith('/discover')"
            class="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full"></div>
          <div v-else
            class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white rounded-full transition-all duration-150 group-hover:w-full -translate-x-1/2">
          </div>
        </router-link>
        <router-link v-if="authStore.user" to="/feed"
          class="relative px-4 text-sm transition-all duration-150 h-14 group"
          :class="route.path.startsWith('/feed') ? 'text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-500/10'"
          @click="scrollToTop">
          <span class="flex items-center justify-center h-full mt-px">
            <Activity :size="16" class="md:mr-2" />
            <span class="hidden md:inline">Feed</span>
          </span>
          <div v-if="route.path.startsWith('/feed')"
            class="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full"></div>
          <div v-else
            class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white rounded-full transition-all duration-150 group-hover:w-full -translate-x-1/2">
          </div>
        </router-link>
      </div>

      <!-- Right section -->
      <div class="flex items-center justify-end flex-1 space-x-2">
        <button v-if="!authStore.user" @click="handleDiscordSignIn" class="w-40 h-10 text-sm button-visible"
          :class="{ 'opacity-0': authStore.loading }" :disabled="authStore.loading">
          <span v-if="!authStore.loading">Sign in with Discord</span>
          <LoadingSpinner v-else />
        </button>

        <div v-else class="relative" ref="dropdownRef">
          <button @click.stop="toggleDropdown" class="flex items-center h-10 px-1.5 text-sm sm:px-2 -mr-2 sm:mr-0"
            :class="isDropdownOpen ? 'button-active-noborder' : 'button-noborder'">
            <span class="hidden sm:pl-1 sm:pr-2 sm:inline">
              {{
                (authStore.username ?? '').length > 20
                  ? (authStore.username ?? '').substring(0, 20) + '...'
                  : authStore.username
              }}
            </span>
            <img v-if="authStore.avatarUrl" :src="authStore.avatarUrl" class="w-8 h-8 rounded-full" alt="User avatar" />
          </button>


          <div v-if="isDropdownOpen"
            class="absolute right-0 w-48 py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-x-in-[0%] motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
            <router-link :to="{ name: 'userProfile', params: { id: authStore.user?.id } }" @click="closeDropdown"
              class="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <UserCircle2 :size="16" class="mr-2" />
              Profile
            </router-link>
            <button @click="openSettings"
              class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <Settings :size="16" class="mr-2" />
              Settings
            </button>
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

  <SettingsModal ref="settingsModalRef" />
</template>