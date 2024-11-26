<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { useDeckStore } from '../../../stores/deckStore';

defineProps<{
    deckId: string;
    selectedCard: string | null;
}>();

const emit = defineEmits<{
    'select-card': [cardId: string];
    'create-card': [];
}>();

const deckStore = useDeckStore();

const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

</script>

<template>
    <div class="space-y-4">
        <!-- Card List Header -->
        <div class="flex items-center justify-between">
            <h2 class="pl-1 text-xl font-bold">Cards ({{ deckStore.getCardsByDeckId(deckId).length }})</h2>
            <button @click="emit('create-card')" class="w-10 button">
                <Plus :size="22" />
            </button>
        </div>

        <!-- Card List -->
        <div class="space-y-1.5">
            <div v-for="card in deckStore.getCardsByDeckId(deckId)" 
                :key="card.id"
                class="relative px-4 py-3 h-10 flex items-center group motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity"
                :class="[
                    selectedCard === card.id
                        ? 'panel-active'
                        : 'panel-clickable hover:bg-neutral-800/50'
                ]"
                @click="emit('select-card', card.id)">
                
                <!-- Front of card preview -->
                <div class="text-sm truncate">{{ stripHtml(card.front_content) }}</div>
            </div>
        </div>
    </div>
</template>