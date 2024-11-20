<script setup lang="ts">
import { ref } from 'vue';
import { useDeckStore } from '../stores/deckStore';
import PageLayout from '../components/common/PageLayout.vue';

const deckStore = useDeckStore();
const selectedDeck = ref<string | null>(null);

// Load decks when component mounts
deckStore.fetchDecks();

const selectDeck = async (deckId: string) => {
  selectedDeck.value = deckId;
  await deckStore.fetchCards(deckId);
};
</script>

<template>
  <div class="motion-preset-fade motion-duration-150">
    <PageLayout>
      <template #sidebar>
        <div class="space-y-2">
          <!-- Deck List Header -->
          <div class="flex items-center justify-between">
            <h2 class="pl-0.5 text-xl font-bold">Decks ({{ deckStore.userDecks.length }})</h2>
            <button class="px-6 py-1 text-sm rounded-lg button-accept-visible">New</button>
          </div>

          <!-- Deck List -->
          <div class="space-y-2">
            <div 
              v-for="deck in deckStore.userDecks" 
              :key="deck.id"
              class="px-4 py-3 panel-clickable"
              :class="{ 'bg-neutral-900': selectedDeck === deck.id }"
              @click="selectDeck(deck.id)"
            >
              <div class="text-sm">{{ deck.title }}</div>
              <!-- Divider -->
              <div class="w-full h-px my-3 bg-neutral-800"></div>
              <div class="flex justify-between px-8 text-sm">
                <span class="text-cyan-400">{{ 10 }}</span>
                <span class="text-green-400">{{ 25 }}</span>
                <span class="text-orange-400">{{ 60 }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="selectedDeck" class="space-y-6">
          <!-- Deck Header -->
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">{{ deckStore.getDeckById(selectedDeck)?.title }}</h1>
            <div class="space-x-2">
              <button class="px-4 py-2 rounded-lg button-lighter-visible">Edit</button>
              <button class="px-4 py-2 rounded-lg button-danger-visible">Delete</button>
            </div>
          </div>

          <!-- Deck Description -->
          <p class="text-neutral-400">{{ deckStore.getDeckById(selectedDeck)?.description }}</p>

          <!-- Deck Stats -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-neutral-400">New:</span>
              <span>10</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Learning:</span>
              <span>25</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Graduated:</span>
              <span>60</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Total:</span>
              <span>243</span>
            </div>
          </div>

          <!-- Study Button -->
          <div class="flex justify-center">
            <button class="w-32 px-4 py-2 rounded-lg button-accept-visible">
              Study
            </button>
          </div>
        </div>

        <div v-else class="flex items-center justify-center mt-16 text-neutral-500">
          Select a deck to view details
        </div>
      </template>
    </PageLayout>
  </div>
</template>