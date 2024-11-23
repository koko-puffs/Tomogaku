<template>
    <div class="space-y-8 motion-preset-fade motion-duration-100">
        <!-- Header with Sync Button -->
        <div class="flex items-center justify-between">
            <div>
                <h3 class="font-bold text-md">Profile Settings</h3>
                <p class="text-sm text-neutral-400">Manage your personal information and profile preferences</p>
            </div>
            <button @click="handleSync" class="flex items-center h-10 gap-2 px-4 button-lighter-visible"
                :disabled="syncLoading">
                <RefreshCw :class="{ 'animate-spin': syncLoading }" :size=18 />
                Refresh Discord Data
            </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-8">
            <!-- Basic Information -->
            <div class="p-6 space-y-4 border rounded-lg border-neutral-800">
                <h4 class="font-bold text-md">Basic Information</h4>

                <!-- Username -->
                <div class="space-y-2">
                    <label class="text-sm">Username</label>
                    <input v-model="formData.username" type="username" class="w-full input-lighter-filled" disabled />
                    <p class="text-sm text-neutral-400">Username cannot be changed</p>
                </div>

                <!-- Email -->
                <div class="space-y-2">
                    <label class="text-sm">Email</label>
                    <input v-model="formData.email" type="email" class="w-full input-lighter-filled" disabled />
                    <p class="text-sm text-neutral-400">Email cannot be changed</p>
                </div>

                <!-- Bio -->
                <div class="space-y-2">
                    <label class="text-sm">Bio</label>
                    <textarea v-model="formData.bio" class="w-full h-24 resize-none input-lighter-filled !-mb-1"
                        placeholder="Tell others about yourself..."></textarea>
                </div>

                <!-- Gender -->
                <div class="space-y-2">
                    <label class="text-sm">Gender</label>
                    <div class="relative">
                        <select v-model="formData.gender" class="w-full pr-10 appearance-none input-lighter-filled">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non_binary">Non-binary</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                        <ChevronDown
                            class="absolute w-5 h-5 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-neutral-200" />
                    </div>
                </div>

                <!-- Birthday -->
                <div class="space-y-2">
                    <label class="text-sm">Birthday</label>
                    <input v-model="formData.birthday" type="date"
                        class="w-full input-lighter-filled [color-scheme:dark]" />
                </div>

                <!-- Language -->
                <div class="space-y-2">
                    <label class="text-sm">Language</label>
                    <div class="relative">
                        <select v-model="formData.language" class="w-full pr-10 appearance-none input-lighter-filled">
                            <option value="en">English</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                            <option value="zh">Chinese</option>
                        </select>
                        <ChevronDown
                            class="absolute w-5 h-5 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-neutral-200" />
                    </div>
                </div>
            </div>

            <!-- Account Information -->
            <div class="p-6 space-y-6 border rounded-lg border-neutral-800">
                <h4 class="font-bold text-md">Account Information</h4>

                <!-- Account Type -->
                <div class="space-y-2">
                    <label class="text-sm text-neutral-400">Account Type</label>
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 text-sm rounded-full" :class="{
                            'bg-blue-500/20 text-blue-400': formData.account_type === 'premium',
                            'bg-neutral-500/20 text-neutral-400': formData.account_type === 'free'
                        }">
                            {{ formData.account_type === 'premium' ? 'Premium' : 'Free' }}
                        </span>
                        <button v-if="formData.account_type === 'free'" type="button"
                            class="text-sm text-blue-400 hover:underline">
                            Upgrade to Premium
                        </button>
                    </div>
                </div>

                <!-- Join Date -->
                <div class="space-y-2">
                    <label class="text-sm text-neutral-400">Member Since</label>
                    <div class="text-sm">
                        {{ formatDate(formData.joined_at) }}
                    </div>
                </div>

                <!-- Statistics -->
                <div class="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="text-sm text-neutral-400">Study Streak</label>
                        <div class="text-sm">{{ formData.streak_days }} days</div>
                    </div>
                    <div>
                        <label class="text-sm text-neutral-400">Longest Streak</label>
                        <div class="text-sm">{{ formData.longest_streak }} days</div>
                    </div>
                    <div>
                        <label class="text-sm text-neutral-400">Cards Studied</label>
                        <div class="text-sm">{{ formData.total_cards_studied }}</div>
                    </div>
                    <div>
                        <label class="text-sm text-neutral-400">Study Time</label>
                        <div class="text-sm">{{ formatStudyTime(formData.total_study_time_minutes) }}</div>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end space-x-2">
                <button type="button" @click="resetForm" class="w-24 button-lighter" :disabled="loading">
                    Reset
                </button>
                <button type="submit" class="w-24 button-accept-visible" :disabled="loading || !hasChanges">
                    <LoadingSpinner v-if="loading" class="w-5 h-5" />
                    <span v-else>Save</span>
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../../../stores/authStore'
import { useUsersStore } from '../../../stores/usersStore'
import LoadingSpinner from '../../common/LoadingSpinner.vue'
import { ChevronDown, RefreshCw } from 'lucide-vue-next'

const authStore = useAuthStore()
const usersStore = useUsersStore()

const loading = ref(false)
const errors = reactive({
    username: ''
})

const syncLoading = ref(false)

const handleSync = async () => {
    syncLoading.value = true
    try {
        await authStore.syncDiscordProfile()
    } catch (error) {
        console.error('Failed to sync with Discord:', error)
    } finally {
        syncLoading.value = false
    }
}

// Form data
const formData = reactive({
    username: authStore.userProfile?.username || '',
    email: authStore.userProfile?.email || '',
    bio: authStore.userProfile?.bio || '',
    gender: authStore.userProfile?.gender || 'prefer_not_to_say',
    birthday: authStore.userProfile?.birthday || '',
    language: authStore.userProfile?.language || 'en',
    // Read-only fields
    account_type: authStore.userProfile?.account_type || 'free',
    joined_at: authStore.userProfile?.joined_at || '',
    streak_days: authStore.userProfile?.streak_days || 0,
    longest_streak: authStore.userProfile?.longest_streak || 0,
    total_cards_studied: authStore.userProfile?.total_cards_studied || 0,
    total_study_time_minutes: authStore.userProfile?.total_study_time_minutes || 0
})

// Initial data for comparison
const initialData = {
    bio: authStore.userProfile?.bio || '',
    gender: authStore.userProfile?.gender || 'prefer_not_to_say',
    birthday: authStore.userProfile?.birthday || '',
    language: authStore.userProfile?.language || 'en'
}

const hasChanges = computed(() => {
    return formData.bio !== initialData.bio ||
        formData.gender !== initialData.gender ||
        formData.birthday !== initialData.birthday ||
        formData.language !== initialData.language
})

// Form submission
const handleSubmit = async () => {
    errors.username = ''

    loading.value = true
    try {
        // Check if birthday is the default value or empty, set to null in those cases
        const birthdayToSubmit = (formData.birthday === 'mm/dd/yyyy' || formData.birthday === '')
            ? null
            : formData.birthday

        await usersStore.updateUserProfile({
            bio: formData.bio,
            gender: formData.gender,
            birthday: birthdayToSubmit,
            language: formData.language
        })

        Object.assign(initialData, {
            bio: formData.bio,
            gender: formData.gender,
            birthday: birthdayToSubmit,
            language: formData.language
        })
    } catch (error) {
        console.error('Failed to update profile:', error)
    } finally {
        loading.value = false
    }
}

const resetForm = () => {
    Object.assign(formData, initialData)
}

// Utility functions
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
        return `${remainingMinutes} minutes`
    } else if (remainingMinutes === 0) {
        return `${hours} hours`
    } else {
        return `${hours}h ${remainingMinutes}m`
    }
}
</script>