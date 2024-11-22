<script setup lang="ts">
import { GitFork, Heart, Clock, RefreshCw, Layers3 } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useDeckStore } from '../../../stores/deckStore';
import { useUsersStore } from '../../../stores/usersStore';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../../types/supabase';

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
        await deckStore.forkDeck(props.deck.id);
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
</script>

<template>
    <div class="space-y-6">
        <!-- Deck Header -->
        <div class="flex items-start justify-between w-full">
            <!-- Title -->
            <div class="motion-translate-y-in-[-12%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
                <h1 class="text-2xl font-bold">
                    {{ props.deck.title }}
                </h1>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2 motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
                <button 
                    class="flex items-center gap-2 px-4 py-2 button-visible" 
                    @click="handleLike"
                    :disabled="isLiking"
                >
                    <Heart 
                        :size="18" 
                        :class="{
                            'text-red-500 fill-red-500': deckStore.isDeckLiked(props.deck.id)
                        }" 
                    />
                    {{ localLikesCount }}
                </button>
                <button 
                    class="flex items-center gap-2 px-4 py-2 button-accept-visible" 
                    @click="handleFork"
                    :disabled="isForking"
                >
                    <GitFork :size="18" />
                    {{ isForking ? 'Forking...' : 'Fork Deck' }}
                </button>
            </div>
        </div>

        <!-- Author Info -->
        <div v-if="author" class="flex items-center gap-3">
            <img 
                :src="author.avatar_url || '/default-avatar.png'" 
                :alt="author.username"
                class="object-cover w-10 h-10 rounded-full"
            />
            <div class="flex flex-col">
                <span class="font-medium">{{ author.username }}</span>
                <span class="text-sm text-neutral-400">Created {{ formatDate(props.deck.created_at) }}</span>
            </div>
        </div>

        <!-- Tags Section -->
        <div v-if="props.deck.tags?.length" class="flex flex-wrap gap-2">
            <span v-for="tag in props.deck.tags" :key="tag"
                class="px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                {{ tag }}
            </span>
        </div>

        <!-- Description -->
        <div v-if="props.deck.description" class="p-4 rounded-lg bg-neutral-800/30">
            <p class="whitespace-pre-wrap text-neutral-300" v-html="props.deck.description.replace(/\n/g, '<br />')"></p>
        </div>

        <!-- Deck Stats -->
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="p-4 space-y-1 rounded-lg bg-neutral-800/30">
                <div class="flex items-center gap-2 text-neutral-400">
                    <Layers3 :size="18" />
                    <span>Cards</span>
                </div>
                <p class="text-xl font-medium">{{ props.deck.card_count }}</p>
            </div>

            <div class="p-4 space-y-1 rounded-lg bg-neutral-800/30">
                <div class="flex items-center gap-2 text-neutral-400">
                    <GitFork :size="18" />
                    <span>Forks</span>
                </div>
                <p class="text-xl font-medium">{{ props.deck.fork_count }}</p>
            </div>

            <div class="p-4 space-y-1 rounded-lg bg-neutral-800/30">
                <div class="flex items-center gap-2 text-neutral-400">
                    <Clock :size="18" />
                    <span>Created</span>
                </div>
                <p class="text-sm font-medium">{{ formatDate(props.deck.created_at) }}</p>
            </div>

            <div class="p-4 space-y-1 rounded-lg bg-neutral-800/30">
                <div class="flex items-center gap-2 text-neutral-400">
                    <RefreshCw :size="18" />
                    <span>Updated</span>
                </div>
                <p class="text-sm font-medium">{{ formatDate(props.deck.updated_at) }}</p>
            </div>
        </div>
    </div>
</template>