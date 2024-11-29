<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFSRSStore } from '../../../stores/fsrsStore';
import { useDeckStore } from '../../../stores/deckStore';
import { useAuthStore } from '../../../stores/authStore';
import { Rating } from 'ts-fsrs';
import type { Card } from '../../../types/deck.types';

const props = defineProps<{
  deckId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fsrsStore = useFSRSStore();
const deckStore = useDeckStore();
const authStore = useAuthStore();

const currentCard = ref<Card | null>(null);
const isFlipped = ref(false);
const stats = ref<{
  totalCards: number;
  completedCards: number;
  remainingCards: number;
  newCardsStudied: number;
  reviewsCompleted: number;
} | null>(null);
const isLoading = ref(true);

const startSession = async () => {
  try {
    isLoading.value = true;
    const deck = await deckStore.getDeckById(props.deckId);
    if (!deck) throw new Error('Deck not found');

    await fsrsStore.startStudySession(props.deckId, deck.daily_new_cards_limit, deck.daily_review_limit);
    currentCard.value = fsrsStore.getNextCard();
    stats.value = fsrsStore.getStudySessionStats();
  } catch (error) {
    console.error('Failed to start study session:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleAnswer = async (rating: Rating) => {
  if (!currentCard.value || !authStore.user) return;

  try {
    isLoading.value = true;
    await fsrsStore.processReview(currentCard.value, rating, authStore.user.id);
    
    // Get next card
    currentCard.value = fsrsStore.getNextCard();
    if (currentCard.value) {
      isFlipped.value = false;
    }
    
    // Update stats
    stats.value = fsrsStore.getStudySessionStats();
  } catch (error) {
    console.error('Failed to process review:', error);
  } finally {
    isLoading.value = false;
  }
};

const endSession = async () => {
  if (!currentCard.value) return;
  
  try {
    await fsrsStore.endStudySession(props.deckId);
    emit('close');
  } catch (error) {
    console.error('Failed to end session:', error);
  }
};

onMounted(startSession);

const flipCard = () => {
  isFlipped.value = true;
};

const getKeyboardShortcuts = (e: KeyboardEvent) => {
  if (!currentCard.value) return;
  
  switch(e.key) {
    case ' ':
      if (!isFlipped.value) {
        flipCard();
      }
      break;
    case '1':
      if (isFlipped.value) handleAnswer(Rating.Again);
      break;
    case '2':
      if (isFlipped.value) handleAnswer(Rating.Hard);
      break;
    case '3':
      if (isFlipped.value) handleAnswer(Rating.Good);
      break;
    case '4':
      if (isFlipped.value) handleAnswer(Rating.Easy);
      break;
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90" 
       @keydown="getKeyboardShortcuts" 
       tabindex="0">
    <div class="w-full max-w-3xl overflow-hidden rounded-lg shadow-xl bg-neutral-900">
      <!-- Header with stats -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-800">
        <div class="flex gap-4 text-sm text-neutral-400">
          <span>New: {{ stats?.newCardsStudied || 0 }}</span>
          <span>Review: {{ stats?.reviewsCompleted || 0 }}</span>
          <span>Remaining: {{ stats?.remainingCards || 0 }}</span>
        </div>
        <button @click="endSession" 
                class="text-neutral-400 hover:text-neutral-200">
          Close
        </button>
      </div>

      <!-- Main content -->
      <div class="p-6" v-if="!isLoading">
        <template v-if="currentCard">
          <!-- Card content -->
          <div class="min-h-[200px] flex flex-col items-center justify-center p-4">
            <div v-if="!isFlipped" 
                 class="text-center cursor-pointer" 
                 @click="flipCard">
              <div class="whitespace-pre-wrap">{{ currentCard.front_content }}</div>
              <div class="mt-4 text-sm text-neutral-500">Click to flip</div>
            </div>
            <div v-else 
                 class="text-center">
              <div class="whitespace-pre-wrap">{{ currentCard.back_content }}</div>
            </div>
          </div>

          <!-- Answer buttons -->
          <div v-if="isFlipped" 
               class="flex justify-center gap-2 mt-6">
            <button @click="handleAnswer(Rating.Again)"
                    class="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                    title="Shortcut: 1">
              Again
            </button>
            <button @click="handleAnswer(Rating.Hard)"
                    class="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
                    title="Shortcut: 2">
              Hard
            </button>
            <button @click="handleAnswer(Rating.Good)"
                    class="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                    title="Shortcut: 3">
              Good
            </button>
            <button @click="handleAnswer(Rating.Easy)"
                    class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    title="Shortcut: 4">
              Easy
            </button>
          </div>
          <div v-else 
               class="mt-4 text-sm text-center text-neutral-500">
            Press spacebar to flip
          </div>
        </template>
        
        <!-- Session complete -->
        <template v-else>
          <div class="py-12 text-center">
            <h3 class="mb-2 text-xl font-semibold">Session Complete!</h3>
            <p class="mb-6 text-neutral-400">
              You've reviewed {{ stats?.completedCards }} cards
            </p>
            <button @click="endSession"
                    class="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600">
              Close Session
            </button>
          </div>
        </template>
      </div>

      <!-- Loading state -->
      <div v-else class="flex justify-center p-6">
        <div class="w-8 h-8 border-t-2 rounded-full animate-spin border-neutral-200"></div>
      </div>
    </div>
  </div>
</template>