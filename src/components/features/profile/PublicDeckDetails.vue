<script setup lang="ts">
import { GitFork, Heart, Clock, RefreshCw, Layers3, Edit2, Trash2 } from 'lucide-vue-next';
import { ref, onMounted, computed, watch } from 'vue';
import { useDeckStore } from '../../../stores/deckStore';
import { useUsersStore } from '../../../stores/usersStore';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../../types/supabase';
import { useRouter, useRoute } from 'vue-router';
import DeckEditForm from '../decks/DeckEditForm.vue';
import { useAuthStore } from '../../../stores/authStore';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

const props = defineProps<{
    deck: any;
}>();

const deckStore = useDeckStore();
const usersStore = useUsersStore();
const isForking = ref(false);
const isLiking = ref(false);
const author = ref<UserProfile | null>(null);
const localLikesCount = ref(props.deck.likes_count || 0);
const router = useRouter();
const authStore = useAuthStore();
const route = useRoute();

onMounted(async () => {
    try {
        author.value = usersStore.getUserProfile(props.deck.user_id) || null;
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
});

const handleFork = async () => {
    isForking.value = true;
    try {
        const newDeck = await deckStore.forkDeck(props.deck.id);
        router.push(`/learn/${newDeck.id}`);
    } catch (error) {
        console.error('Failed to fork deck:', error);
    } finally {
        isForking.value = false;
    }
};

const handleLike = async () => {
    isLiking.value = true;
    try {
        const likeDelta = await deckStore.toggleDeckLike(props.deck.id);
        localLikesCount.value += likeDelta;
    } catch (error) {
        console.error('Failed to toggle like:', error);
    } finally {
        isLiking.value = false;
    }
};

// Format dates
const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Move isOwner computed property before isEditing initialization
const isOwner = computed(() => {
    return authStore.user?.id === props.deck.user_id;
});

// Initialize isEditing based on URL hash AND ownership
const isEditing = ref(route.hash === '#edit' && isOwner.value);

// Watch for deck changes to reset edit mode
watch(() => props.deck.id, () => {
    isEditing.value = false;
});

// Update the URL when edit state changes, but only if owner
watch(isEditing, (newValue) => {
    if (!isOwner.value) return;

    if (newValue) {
        router.replace({ hash: '#edit' });
    } else {
        router.replace({ hash: '' });
    }
});

const startEdit = () => {
    if (!isOwner.value) return;
    isEditing.value = true;
};

const cancelEdit = () => {
    isEditing.value = false;
};

// Add emit definition
const emit = defineEmits<{
    'delete': [];
    'update': [{ title: string, description: string | null, tags: string[] | null, visibility: 'private' | 'public' }];
}>();

// Update handleUpdate to emit instead of direct handling
const handleUpdate = (updatedData: {
    title: string,
    description: string | null,
    tags: string[] | null,
    visibility: 'private' | 'public'
}) => {
    emit('update', updatedData);
    isEditing.value = false;
};

// Update delete handler to emit event
const handleDelete = () => {
    emit('delete');
};

// Watch for hash changes to prevent non-owners from accessing edit mode
watch(() => route.hash, (newHash) => {
    if (newHash === '#edit' && !isOwner.value) {
        router.replace({ hash: '' });
    }
});
</script>

<template>
    <div class="space-y-6">
        <!-- Deck Header -->
        <div class="flex items-center justify-between w-full">
            <!-- Edit Mode -->
            <div v-if="isEditing"
                class="flex-1 w-full motion-translate-y-in-[-1.4%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                <DeckEditForm :title="props.deck.title" :description="props.deck.description" :tags="props.deck.tags"
                    :visibility="props.deck.visibility" @update="handleUpdate" @cancel="cancelEdit" />
                <div class="h-px mt-6 bg-neutral-800"></div>
            </div>

            <!-- View Mode -->
            <template v-else>
                <div
                    class="motion-translate-y-in-[-12%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
                    <div class="space-y-1">
                        <h1 class="relative flex items-center gap-1.5 text-xl font-bold pl-1 max-w-[300px]">
                            <span class="leading-none truncate">{{ props.deck.title }}</span>
                        </h1>
                        <RouterLink v-if="props.deck.is_forked && props.deck.original_deck_id"
                            :to="`/discover/deck/${props.deck.original_deck_id}`"
                            class="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 transition-colors pl-1">
                            <GitFork :size="14" />
                            <span class="leading-none">View original deck</span>
                        </RouterLink>
                    </div>
                </div>
            </template>

            <!-- Action Buttons -->
            <div v-if="!isEditing"
                class="flex gap-2 motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
                <div v-if="isOwner" class="flex">
                    <button class="w-10 button" @click="startEdit">
                        <Edit2 :size="18" />
                    </button>
                    <button @click="handleDelete" class="w-10 button">
                        <Trash2 :size="18" />
                    </button>
                </div>
                <button class="flex items-center gap-2 px-4 py-2 button-emerald-visible" @click="handleFork"
                    :disabled="isForking">
                    <GitFork :size="18" />
                    {{ isForking ? 'Forking...' : 'Fork deck' }}
                </button>
            </div>
        </div>


        <!-- Author Info -->
        <div v-if="author" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <router-link :to="`/discover/user/${author.id}`" class="transition-opacity hover:opacity-80">
                    <img :src="author.avatar_url || '/default-avatar.png'" :alt="author.username"
                        class="object-cover w-10 h-10 rounded-full" />
                </router-link>
                <div class="flex flex-col space-y-1">
                    <router-link :to="`/discover/user/${author.id}`"
                        class="font-medium leading-none transition-colors hover:text-neutral-300">
                        {{ author.username }}
                    </router-link>
                    <span class="text-sm leading-none text-neutral-500">{{ author.followers_count }} follower(s)</span>
                </div>
            </div>
            <button @click="handleLike" 
                class="flex items-center gap-1.5 px-3 py-2.5 group active:scale-90 transition-transform" 
                :disabled="isLiking">
                <Heart :size="18" 
                    :class="{
                        'text-rose-400 fill-rose-400': deckStore.isDeckLiked(props.deck.id),
                        'text-neutral-400 group-hover:text-neutral-300': !deckStore.isDeckLiked(props.deck.id)
                    }" />
                <span class="text-sm leading-none -mb-0.5" 
                    :class="{
                        'text-rose-400': deckStore.isDeckLiked(props.deck.id),
                        'text-neutral-400 group-hover:text-neutral-300': !deckStore.isDeckLiked(props.deck.id)
                    }">{{ localLikesCount }}</span>
            </button>
        </div>

        <!-- Description Panel with Tags -->
        <div class="space-y-2">
            <div v-if="props.deck.description || props.deck.tags?.length" class="p-2.5 space-y-2.5 panel">
                <!-- Description -->
                <div v-if="props.deck.description" class="px-1.5 py-1 space-y-2">
                    <h3 class="text-sm font-medium text-neutral-400">Description</h3>
                    <p class="whitespace-pre-wrap text-neutral-200">{{ props.deck.description }}</p>
                </div>

                <!-- Tags -->
                <div v-if="props.deck.tags?.length" class="space-y-2">
                    <div class="flex flex-wrap gap-2">
                        <span v-for="tag in props.deck.tags" :key="tag"
                            class="px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                            {{ tag }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Deck Stats -->
            <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div class="p-4 space-y-1 panel">
                    <div class="flex items-center gap-2 text-neutral-400">
                        <Layers3 :size="18" />
                        <span class="mt-0.5">Cards</span>
                    </div>
                    <p class="text-xl font-medium">{{ props.deck.card_count }}</p>
                </div>

                <div class="p-4 space-y-1 panel">
                    <div class="flex items-center gap-2 text-neutral-400">
                        <GitFork :size="18" />
                        <span class="mt-0.5">Forks</span>
                    </div>
                    <p class="text-xl font-medium">{{ props.deck.fork_count }}</p>
                </div>

                <div class="p-4 space-y-1 panel">
                    <div class="flex items-center gap-2 text-neutral-400">
                        <Clock :size="18" />
                        <span class="mt-0.5">Created</span>
                    </div>
                    <p class="text-sm font-medium leading-6">{{ formatDate(props.deck.created_at) }}</p>
                </div>

                <div class="p-4 space-y-1 panel">
                    <div class="flex items-center gap-2 text-neutral-400">
                        <RefreshCw :size="18" />
                        <span class="mt-0.5">Updated</span>
                    </div>
                    <p class="text-sm font-medium leading-6">{{ formatDate(props.deck.updated_at) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>