<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-center bg-black/50" @click="closeModal">
    <!-- Modal container -->
    <div
      class="relative w-[1000px] max-h-fit my-20 bg-neutral-900 rounded-lg shadow-xl border border-neutral-800 motion-translate-y-in-[-1%] motion-opacity-in-[0%] motion-duration-[0.2s]"
      @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between px-3 py-3 border-b border-neutral-800">
        <h2 class="pl-2 text-xl font-semibold">Settings</h2>
        <button @click="closeModal" class="p-2 transition-colors rounded-lg hover:bg-neutral-800">
          <X :size="20" />
        </button>
      </div>

      <!-- Content area -->
      <div class="flex h-[calc(100%-61px)]">
        <!-- Sidebar -->
        <div class="w-64 border-r border-neutral-800">
          <nav class="p-4 space-y-1">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
              class="flex items-center w-full px-4 py-2 text-sm transition-colors rounded-lg"
              :class="activeTab === tab.id ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'">
              <component :is="tab.icon" :size="18" class="mr-3" />
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Main content -->
        <div class="flex-1 p-6 overflow-y-auto">
          <component :is="currentTabComponent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { X, User, Brain, Bell, Palette, Shield, Keyboard } from 'lucide-vue-next'
import ProfileSettings from './ProfileSettings.vue'
// import StudySettings from './StudySettings.vue'
// import NotificationSettings from './NotificationSettings.vue'
// import AppearanceSettings from './AppearanceSettings.vue'
// import PrivacySettings from './PrivacySettings.vue'
// import KeyboardSettings from './KeyboardSettings.vue'

const isOpen = ref(false)
const activeTab = ref('profile')

const tabs = [
  {
    id: 'profile',
    name: 'Profile',
    icon: User,
    component: ProfileSettings
  },
  {
    id: 'study',
    name: 'Study & Learning',
    icon: Brain,
    component: StudySettings
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    component: NotificationSettings
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: Palette,
    component: AppearanceSettings
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: Shield,
    component: PrivacySettings
  },
  {
    id: 'keyboard',
    name: 'Keyboard Shortcuts',
    icon: Keyboard,
    component: KeyboardSettings
  }
]

const currentTabComponent = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab?.component
})

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
}

// Expose methods for parent component
defineExpose({ openModal, closeModal })
</script>

<script lang="ts">
// Define placeholder components
const StudySettings = defineComponent({
  name: 'StudySettings',
  setup() {
    return () => h('div', { class: 'space-y-4' }, [
      h('h3', { class: 'text-lg font-medium' }, 'Study & Learning Settings'),
      h('p', { class: 'text-neutral-400' }, 'Settings coming soon...')
    ])
  }
})

const NotificationSettings = defineComponent({
  name: 'NotificationSettings',
  setup() {
    return () => h('div', { class: 'space-y-4' }, [
      h('h3', { class: 'text-lg font-medium' }, 'Notification Settings'),
      h('p', { class: 'text-neutral-400' }, 'Settings coming soon...')
    ])
  }
})

const AppearanceSettings = defineComponent({
  name: 'AppearanceSettings',
  setup() {
    return () => h('div', { class: 'space-y-4' }, [
      h('h3', { class: 'text-lg font-medium' }, 'Appearance Settings'),
      h('p', { class: 'text-neutral-400' }, 'Settings coming soon...')
    ])
  }
})

const PrivacySettings = defineComponent({
  name: 'PrivacySettings',
  setup() {
    return () => h('div', { class: 'space-y-4' }, [
      h('h3', { class: 'text-lg font-medium' }, 'Privacy & Security Settings'),
      h('p', { class: 'text-neutral-400' }, 'Settings coming soon...')
    ])
  }
})

const KeyboardSettings = defineComponent({
  name: 'KeyboardSettings',
  setup() {
    return () => h('div', { class: 'space-y-4' }, [
      h('h3', { class: 'text-lg font-medium' }, 'Keyboard Shortcuts'),
      h('p', { class: 'text-neutral-400' }, 'Settings coming soon...')
    ])
  }
})
</script>