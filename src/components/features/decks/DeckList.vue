<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
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
    }, 60000) as unknown as number;
  }
});

// Clean up interval when component unmounts
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
    <div class="space-y-2">
        <!-- Deck List Header -->
        <div class="flex items-center justify-between">
            <h2 class="pl-1 text-xl font-bold">Decks ({{ deckStore.userDecks.length }})</h2>
            <button @click="emit('create-deck')" class="w-10 h-10 button-visible">
                <Plus :size="18" />
            </button>
        </div>

        <!-- Deck List -->
        <div class="space-y-2">
            <div v-for="deck in deckStore.userDecks" :key="deck.id" class="px-4 py-3 group"
                :class="selectedDeck === deck.id ? 'panel-active' : 'panel-clickable'"
                @click="emit('select-deck', deck.id)">
                <div class="text-sm">{{ deck.title }}</div>
                <!-- Divider -->
                <div class="w-full h-px my-3 transition-all duration-75"
                    :class="[selectedDeck === deck.id ? 'bg-neutral-700' : 'bg-neutral-800 group-hover:bg-neutral-700']">
                </div>
                <div class="flex justify-between px-8 text-sm">
                    <span class="relative group/tooltip">
                        <span class="text-cyan-400">{{ 10 }}</span>
                        <div class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                            New cards due
                        </div>
                    </span>
                    <span class="relative group/tooltip">
                        <span class="text-green-400">{{ 25 }}</span>
                        <div class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                            To-review cards due
                        </div>
                    </span>
                    <span class="relative group/tooltip">
                        <span class="text-orange-400">{{ 60 }}</span>
                        <div class="absolute invisible p-2 text-sm font-medium transition-all -translate-x-1/2 -translate-y-1 border rounded-md shadow-lg opacity-0 border-neutral-800 left-1/2 bottom-full bg-neutral-900 w-max text-neutral-400 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                            Learning cards due
                        </div>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>