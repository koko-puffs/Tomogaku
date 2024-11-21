<template>
  <div class="motion-preset-fade motion-duration-150">
    <div v-if="loading">Loading...</div>

    <div v-else-if="error">
      <NotFound />
    </div>

    <div v-else-if="!userProfile">
      <NotFound />
    </div>

    <div v-else>
      <PageLayout>
        <template #sidebar>
          <div class="space-y-4">
            <!-- Profile Header -->
            <div class="p-4 pt-6 space-y-3 panel">
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
                <button @click="handleFollowToggle" :disabled="followLoading || !canFollow"
                  class="w-full h-10 px-4 transition-colors duration-200 rounded-lg" :class="{
                    'button-accept-visible': !isFollowing && canFollow,
                    'button-lighter-visible': isFollowing && canFollow,
                    'button-disabled': !canFollow
                  }">
                  {{ isFollowing ? 'Unfollow' : 'Follow' }}
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
                <div v-if="userProfile.gender">
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
            <div class="p-3 panel">
              <h2 class="mx-1 mb-2 font-bold text-md text-neutral-200">Stats</h2>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Followers</span>
                  <p class="text-lg font-semibold">{{ userProfile.followers_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Following</span>
                  <p class="text-lg font-semibold">{{ userProfile.following_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Decks Created</span>
                  <p class="text-lg font-semibold">{{ userProfile.decks_created_count }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Cards Studied</span>
                  <p class="text-lg font-semibold">{{ userProfile.total_cards_studied }}</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Current Streak</span>
                  <p class="text-lg font-semibold">{{ userProfile.streak_days }} days</p>
                </div>
                <div class="p-4 rounded-lg bg-neutral-800/50">
                  <span class="block text-sm text-neutral-400">Longest Streak</span>
                  <p class="text-lg font-semibold">{{ userProfile.longest_streak }} days</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #content>
          <div class="p-4 panel">
            <p>Content will go here</p>
          </div>
        </template>
      </PageLayout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUsersStore } from '../stores/usersStore';
import { useAuthStore } from '../stores/authStore';
import { UserCircle2 } from 'lucide-vue-next';
import type { Database } from '../types/supabase';
import NotFound from './NotFound.vue';
import PageLayout from '../components/common/PageLayout.vue';

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
const usersStore = useUsersStore();
const authStore = useAuthStore();
const userProfile = ref<UserProfile | undefined>();
const loading = ref(true);
const error = ref<string | null>(null);
const followLoading = ref(false);

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
  loading.value = true;
  error.value = null;
  userProfile.value = undefined;

  try {
    const userId = route.params.id as string;

    // If viewing own profile, use the profile from authStore
    if (authStore.userProfile?.id === userId) {
      // @ts-ignore
      userProfile.value = authStore.userProfile;
    } else {
      const profile = await usersStore.fetchUserProfile(userId);
      if (!profile) {
        error.value = 'User not found';
        return;
      }
      userProfile.value = profile;
    }

    // Fetch following status if looking at another user's profile
    if (authStore.userProfile && !isCurrentUser.value) {
      await usersStore.fetchFollowing();
    }
  } catch (e) {
    error.value = 'User not found';
    console.error('Error loading profile:', e);
  } finally {
    loading.value = false;
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
</script>