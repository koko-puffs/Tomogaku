<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { GitFork, Globe2, Plus } from 'lucide-vue-next';
import { useDeckStore } from '../../../stores/deckStore';
import { useAuthStore } from '../../../stores/authStore';

defineProps<{
    selectedDeck: string | null;
}>();

const emit = defineEmits<{
    'select-deck': [deckId: string];
    'create-deck': [];
}>();

const deckStore = useDeckStore();
const authStore = useAuthStore();

const refreshInterval = ref<number | null>(null);

// Load decks when component mounts and set up refresh interval
onMounted(async () => {
    if (authStore.user) {
        await deckStore.fetchDecksByUserId(authStore.user.id);

        // Set up refresh interval
        refreshInterval.value = setInterval(async () => {
            if (authStore.user) {
                await deckStore.fetchDecksByUserId(authStore.user.id);
            }
        }, 10000) as unknown as number;
    }
});

// Clean up interval when component unmounts
onUnmounted(() => {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
    }
});

const getAvailableNewCards = (deck: any) => {
    // Get today's start timestamp
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count new cards already studied today
    const newCardsStudiedToday = deckStore.cards[deck.id]?.filter(card =>
        card.last_review_date &&
        new Date(card.last_review_date) >= today &&
        card.state === "new"
    ).length || 0;

    // Calculate remaining new cards allowed today
    const remainingNewCards = (deck.daily_new_cards_limit || 20) - newCardsStudiedToday;

    // Return the minimum between total new cards and remaining allowed
    return Math.min(deck.new_cards_count, Math.max(0, remainingNewCards));
};
</script>

<template>
    <div class="space-y-4">
        <!-- Deck List Header -->
        <div class="flex items-center justify-between">
            <h2 class="pl-1 text-xl font-bold">Decks ({{ deckStore.userDecks.length }})</h2>
            <button @click="emit('create-deck')" class="w-10 button" title="Create a new deck">
                <Plus :size="22" />
            </button>
        </div>

        <!-- Deck List -->
        <div class="space-y-2">
            <div v-for="deck in deckStore.userDecks" :key="deck.id"
                class="relative px-4 py-3 group motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity"
                :class="[
                    selectedDeck === deck.id
                        ? 'panel-active'
                        : 'panel-clickable hover:bg-neutral-800/50'
                ]" @click="emit('select-deck', deck.id)">
                <!-- Icons container -->
                <div class="absolute flex gap-2 top-3 right-3">
                    <Globe2 v-if="deck.visibility === 'public'" :size="16" class="text-neutral-500" />
                    <GitFork v-if="deck.is_forked" :size="16" class="text-neutral-500" />
                </div>
                <div class="text-sm truncate max-w-[160px]">{{ deck.title }}</div>
                <!-- Divider -->
                <div class="w-full h-px my-3 transition-all duration-75"
                    :class="[selectedDeck === deck.id ? 'bg-neutral-700' : 'bg-neutral-800']">
                </div>
                <div class="flex justify-between px-8 text-sm">
                    <span class="relative">
                        <span class="peer"
                            :class="getAvailableNewCards(deck) > 0 ? 'text-cyan-400' : 'text-neutral-400'">
                            {{ getAvailableNewCards(deck) }}
                        </span>
                        <div
                            class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 pointer-events-none border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 peer-hover:visible peer-hover:opacity-100">
                            New cards due
                        </div>
                    </span>
                    <span class="relative">
                        <span class="peer" :class="deck.review_cards_count > 0 ? 'text-green-400' : 'text-neutral-400'">
                            {{ deck.review_cards_count }}
                        </span>
                        <div
                            class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 pointer-events-none border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 peer-hover:visible peer-hover:opacity-100">
                            To-review cards due
                        </div>
                    </span>
                    <span class="relative">
                        <span class="peer"
                            :class="deck.learning_cards_count > 0 ? 'text-orange-400' : 'text-neutral-400'">
                            {{ deck.learning_cards_count }}
                        </span>
                        <div
                            class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 pointer-events-none border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 peer-hover:visible peer-hover:opacity-100">
                            Learning cards due
                        </div>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>