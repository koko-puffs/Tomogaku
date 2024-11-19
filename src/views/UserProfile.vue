<template>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error"><NotFound /></div>
    <div v-else-if="userProfile" class="user-profile">
      <div class="profile-header">
        <div class="flex items-center gap-4">
          <img 
            v-if="isCurrentUser && authStore.user?.user_metadata?.avatar_url" 
            :src="authStore.user.user_metadata.avatar_url" 
            class="w-20 h-20 rounded-full"
            alt="Profile avatar"
          />
          <div>
            <h1 class="text-2xl font-bold">
              {{ displayName }}
            </h1>
          </div>
        </div>
      </div>
  
      <div class="profile-stats">
        <p>Followers: {{ userProfile.followers_count }}</p>
        <p>Following: {{ userProfile.following_count }}</p>
        <p>Decks Created: {{ userProfile.decks_created_count }}</p>
      </div>
  
      <button 
        v-if="canFollow"
        @click="handleFollowToggle" 
        :disabled="followLoading"
        class="button-visible"
        :class="{ 'button-active': isFollowing }"
      >
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
    </div>
    <NotFound v-else />
  </template>
  
  <script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUsersStore } from '../stores/usersStore';
import { useAuthStore } from '../stores/authStore';
import type { Database } from '../types/supabase';
import NotFound from './NotFound.vue';

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
    return authStore.user?.id === route.params.id;
  });
  
  const displayName = computed(() => {
    if (isCurrentUser.value && authStore.user) {
      return authStore.user.user_metadata?.custom_claims?.global_name || 
             authStore.user.user_metadata?.name || 
             'Anonymous User';
    }
    return `User ${route.params.id.slice(0, 8)}...`; // Fallback for other users
  });
  
  const isFollowing = computed(() => {
    return usersStore.isFollowing(route.params.id as string);
  });
  
  const canFollow = computed(() => {
    return authStore.user && !isCurrentUser.value;
  });
  
  const handleFollowToggle = async () => {
    if (!authStore.user) return;
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
    const profile = await usersStore.fetchUserProfile(userId);
    
    if (!profile) {
      error.value = 'User not found';
      return;
    }
    
    userProfile.value = profile;

    // If we're not already following this user, fetch following status
    if (authStore.user && !isCurrentUser.value) {
      await usersStore.fetchFollowing();
    }
  } catch (e) {
    error.value = 'User not found';
  } finally {
    loading.value = false;
  }
};

// Watch for route changes to reload profile
watch(
  () => route.params.id,
  () => loadProfile()
);

onMounted(() => {
  loadProfile();
});
  </script>