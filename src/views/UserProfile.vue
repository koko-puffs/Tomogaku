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
            <div class="p-6 space-y-3 border rounded-lg border-neutral-800 bg-neutral-950">
              <!-- Avatar and Name -->
              <div class="text-center">
                <div class="flex justify-center mb-4">
                  <img 
                    v-if="userProfile.avatar_url" 
                    :src="userProfile.avatar_url" 
                    class="w-24 h-24 rounded-full"
                    alt="Profile avatar" 
                  />
                  <div 
                    v-else 
                    class="flex items-center justify-center w-24 h-24 rounded-full bg-neutral-800"
                  >
                    <UserCircle2 :size="48" />
                  </div>
                </div>
                <h1 class="text-xl font-bold">{{ displayName }}</h1>
              </div>

              <!-- Bio section -->
              <div v-if="userProfile.bio" class="text-sm text-left break-words text-neutral-400">
                {{ userProfile.bio }}
              </div>

              <!-- Follow Button -->
              <div v-if="canFollow" class="flex justify-center">
                <button 
                  @click="handleFollowToggle" 
                  :disabled="followLoading"
                  class="w-full h-10 px-4 transition-colors duration-200 rounded-lg" 
                  :class="{
                    'button-accept-visible': !isFollowing,
                    'button-lighter-visible': isFollowing
                  }"
                >
                  {{ isFollowing ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <!-- Stats -->
            <div class="p-6 border rounded-lg border-neutral-800 bg-neutral-950">
              <h2 class="mb-4 font-bold text-md text-neutral-200">Stats</h2>
              <div class="space-y-4">
                <div>
                  <span class="text-sm text-neutral-400">Followers</span>
                  <p class="text-sm">{{ userProfile.followers_count }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Following</span>
                  <p class="text-sm">{{ userProfile.following_count }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Decks Created</span>
                  <p class="text-sm">{{ userProfile.decks_created_count }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Cards Studied</span>
                  <p class="text-sm">{{ userProfile.total_cards_studied }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Current Streak</span>
                  <p class="text-sm">{{ userProfile.streak_days }} days</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Longest Streak</span>
                  <p class="text-sm">{{ userProfile.longest_streak }} days</p>
                </div>
              </div>
            </div>

            <!-- Account Info -->
            <div class="p-6 border rounded-lg border-neutral-800 bg-neutral-950">
              <h2 class="mb-4 font-bold text-md text-neutral-200">Account Info</h2>
              <div class="space-y-4">
                <div>
                  <span class="text-sm text-neutral-400">Joined</span>
                  <p class="text-sm">{{ formatDate(userProfile.joined_at) }}</p>
                </div>
                <div v-if="userProfile.gender">
                  <span class="text-sm text-neutral-400">Gender</span>
                  <p class="text-sm capitalize">{{ userProfile.gender }}</p>
                </div>
                <div v-if="userProfile.birthday">
                  <span class="text-sm text-neutral-400">Birthday</span>
                  <p class="text-sm">{{ formatDate(userProfile.birthday) }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Account Type</span>
                  <p class="text-sm capitalize">{{ userProfile.account_type }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-400">Language</span>
                  <p class="text-sm">{{ getLanguageName(userProfile.language) }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #content>
          <div class="p-4 border rounded-lg border-neutral-800 bg-neutral-950">
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