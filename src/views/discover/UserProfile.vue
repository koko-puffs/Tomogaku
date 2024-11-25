<template>
  <div class="motion-preset-fade motion-duration-150">
    <!-- Gradient overlay -->
    <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-emerald-950/5 to-transparent"></div>
    <div v-if="usersStore.loading.profiles" class="flex items-center justify-center mt-20 text-neutral-500">
      <LoadingSpinner :size="32" />
    </div>

    <div v-else-if="userProfile">
      <PageLayout>
        <template #sidebar>
          <div class="space-y-4">
            <!-- Profile Header -->
            <div class="p-4 pt-6 space-y-3 panel motion-translate-y-in-[-1%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
              <!-- Avatar and Name -->
              <div class="text-center">
                <div class="flex justify-center mb-3">
                  <img v-if="userProfile.avatar_url" :src="userProfile.avatar_url" class="w-24 h-24 rounded-full"
                    alt="Profile avatar" />
                  <div v-else class="flex items-center justify-center w-24 h-24 rounded-full bg-neutral-800">
                    <UserCircle2 :size="48" />
                  </div>
                </div>
                <h1 class="text-xl font-bold">{{ displayName }}</h1>
              </div>

              <!-- Follow Button -->
              <div class="flex justify-center">
                <button @click="handleFollowToggle" :disabled="followLoading || !canFollow || followStatusLoading"
                  class="w-full h-10 px-4 transition-colors duration-200 rounded-lg" :class="{
                    'button-accept-visible': !isFollowing && canFollow && !followStatusLoading,
                    'button-lighter-visible': isFollowing && canFollow && !followStatusLoading,
                    'button-disabled': !canFollow || followStatusLoading
                  }">
                  {{ followStatusLoading ? 'Follow' : (isFollowing ? 'Unfollow' : 'Follow') }}
                </button>
              </div>

              <!-- Account Details -->
              <div class="p-1 space-y-3 text-sm">
                <div v-if="userProfile.bio">
                  <span class="text-sm text-neutral-400">Bio</span>
                  <p class="text-sm break-words">{{ userProfile.bio }}</p>
                </div>
                <div>
                  <span class="text-neutral-400">Language</span>
                  <p>{{ getLanguageName(userProfile.language) }}</p>
                </div>
                <div v-if="userProfile.birthday">
                  <span class="text-neutral-400">Birthday</span>
                  <p>{{ formatDate(userProfile.birthday) }}</p>
                </div>
                <div v-if="userProfile.gender && userProfile.gender !== 'prefer_not_to_say'">
                  <span class="text-neutral-400">Gender</span>
                  <p class="capitalize">{{ userProfile.gender }}</p>
                </div>
                <div>
                  <span class="text-neutral-400">Account Type</span>
                  <p class="capitalize">{{ userProfile.account_type }}</p>
                </div>
                <div>
                  <span class="text-neutral-400">Joined</span>
                  <p>{{ formatDate(userProfile.joined_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="p-3 panel motion-translate-y-in-[-1.6%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
              <h2 class="mx-1 mb-2 font-bold text-md text-neutral-200">Stats</h2>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Followers</span>
                  <p class="text-lg font-semibold">{{ userProfile.followers_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Following</span>
                  <p class="text-lg font-semibold">{{ userProfile.following_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Decks Created</span>
                  <p class="text-lg font-semibold">{{ userProfile.decks_created_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Cards Studied</span>
                  <p class="text-lg font-semibold">{{ userProfile.total_cards_studied }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Current Streak</span>
                  <p class="text-lg font-semibold">{{ userProfile.streak_days }} days</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/70">
                  <span class="block text-sm text-neutral-400">Longest Streak</span>
                  <p class="text-lg font-semibold">{{ userProfile.longest_streak }} days</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #content>
          <!-- Add navigation tabs -->
          <div class="flex mb-4 border-b border-neutral-800">
            <router-link v-for="tab in tabs" :key="tab.id" :to="{
              name: 'userProfile',
              params: { id: route.params.id },
              query: { tab: tab.id }
            }" class="relative px-6 py-3 text-sm transition-colors duration-150" :class="[
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-white'
              ]">
              {{ tab.label }}
              <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full">
              </div>
              <div v-else
                class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white rounded-full transition-all duration-150 group-hover:w-full -translate-x-1/2">
              </div>
            </router-link>
          </div>

          <!-- Tab content -->
          <div v-if="activeTab === 'posts'">
            <p class="text-neutral-400">Posts coming soon...</p>
          </div>

          <div v-else-if="activeTab === 'decks'">
            <PublicDeckList :user-id="route.params.id as string" />
          </div>

          <div v-else-if="activeTab === 'stats'">
            <p class="text-neutral-400">Stats coming soon...</p>
          </div>
        </template>
      </PageLayout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUsersStore } from '../../stores/usersStore';
import { useAuthStore } from '../../stores/authStore';
import { UserCircle2 } from 'lucide-vue-next';
import type { Database } from '../../types/supabase';
import NotFound from '../../views/NotFound.vue';
import PageLayout from '../../components/common/PageLayout.vue';
import PublicDeckList from '../../components/features/profile/PublicDeckList.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';

// Language mapping
const LANGUAGES = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese'
} as const;

type LanguageCode = keyof typeof LANGUAGES;

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

const route = useRoute();
const router = useRouter();
const usersStore = useUsersStore();
const authStore = useAuthStore();
const userProfile = ref<UserProfile | undefined>();
const error = ref<string | null>(null);
const followLoading = ref(false);
const followStatusLoading = ref(true);

// Computed properties
const isCurrentUser = computed(() => {
  return authStore.userProfile?.id === route.params.id;
});

const displayName = computed(() => {
  if (!userProfile.value) return '';
  return userProfile.value.username;
});

const isFollowing = computed(() => {
  return usersStore.isFollowing(route.params.id as string);
});

const canFollow = computed(() => {
  return authStore.userProfile && !isCurrentUser.value;
});

const getLanguageName = (code: string) => {
  return LANGUAGES[code as LanguageCode] || code;
};

const handleFollowToggle = async () => {
  if (!authStore.userProfile) return;
  followLoading.value = true;
  try {
    await usersStore.toggleFollow(route.params.id as string);
  } catch (e) {
    console.error('Failed to toggle follow:', e);
  } finally {
    followLoading.value = false;
  }
};

const loadProfile = async () => {
  error.value = null;
  userProfile.value = undefined;
  followStatusLoading.value = true;

  try {
    const userId = route.params.id as string;

    if (authStore.userProfile?.id === userId) {
      // @ts-ignore
      userProfile.value = authStore.userProfile;
      followStatusLoading.value = false;
    } else {
      const profile = await usersStore.fetchUserProfile(userId);
      if (!profile) {
        router.push({ name: 'notFound' });
        return;
      }
      userProfile.value = profile;

      if (authStore.userProfile && !isCurrentUser.value) {
        await usersStore.fetchFollowing();
      }
    }
  } catch (e) {
    router.push({ name: 'notFound' });
    console.error('Error loading profile:', e);
  } finally {
    followStatusLoading.value = false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Watch for route changes to reload profile
watch(
  () => route.params.id,
  () => loadProfile()
);

// Also watch for auth state changes
watch(
  () => authStore.userProfile,
  (newProfile) => {
    if (newProfile && newProfile.id === route.params.id) {
      userProfile.value = newProfile;
    }
  }
);

onMounted(() => {
  loadProfile();
});

// Add tabs data
const tabs = [
  { id: 'posts', label: 'Posts' },
  { id: 'decks', label: 'Decks' },
  { id: 'stats', label: 'Stats' }
] as const;

// Initialize activeTab based on route query
const activeTab = ref<typeof tabs[number]['id']>(
  (route.query.tab as typeof tabs[number]['id']) || 'posts'
);

// Watch for route query changes to update active tab
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && tabs.some(tab => tab.id === newTab)) {
      activeTab.value = newTab as typeof tabs[number]['id'];
    } else {
      activeTab.value = 'posts';
    }
  }
);
</script>