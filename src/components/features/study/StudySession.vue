<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useFSRSStore } from '../../../stores/fsrsStore';
import { useDeckStore } from '../../../stores/deckStore';
import { useAuthStore } from '../../../stores/authStore';
import { Rating } from 'ts-fsrs';
import type { Card } from '../../../types/deck.types';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

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
const cardStartTime = ref<number>(0);
const cardFlipTime = ref<number>(0);
const elapsedTime = ref(0);
const timerInterval = ref<number | null>(null);

const startSession = async () => {
  try {
    isLoading.value = true;
    const deck = await deckStore.getDeckById(props.deckId);
    if (!deck) throw new Error('Deck not found');

    await fsrsStore.startStudySession(props.deckId, deck.daily_new_cards_limit, deck.daily_review_limit);
    currentCard.value = fsrsStore.getNextCard();
    stats.value = fsrsStore.getStudySessionStats();
    cardStartTime.value = Date.now();
    elapsedTime.value = 0;
    timerInterval.value = window.setInterval(updateTimer, 10);
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
    const reviewDuration = cardFlipTime.value - cardStartTime.value;
    await fsrsStore.processReview(currentCard.value, rating, authStore.user.id, reviewDuration);
    
    // Get next card
    currentCard.value = fsrsStore.getNextCard();
    if (currentCard.value) {
      isFlipped.value = false;
      cardStartTime.value = Date.now();
      elapsedTime.value = 0;
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
  try {
    await fsrsStore.endStudySession(props.deckId);
    emit('close');
  } catch (error) {
    console.error('Failed to end session:', error);
  }
};

onMounted(() => {
  document.body.classList.add('overflow-hidden');
  startSession();
});

const flipCard = () => {
  isFlipped.value = true;
  cardFlipTime.value = Date.now();
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
};

const getKeyboardShortcuts = (e: KeyboardEvent) => {
  if (!currentCard.value) return;
  
  switch(e.key) {
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

const updateTimer = () => {
  if (!isFlipped.value) {
    elapsedTime.value = Date.now() - cardStartTime.value;
  }
};

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden');
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

const formattedTime = computed(() => {
  const seconds = Math.floor(elapsedTime.value / 1000);
  const milliseconds = Math.floor((elapsedTime.value % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
});

// Add this to ensure focus when mounted
const container = ref<HTMLElement | null>(null);
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center p-4 bg-neutral-950/90" 
       @keydown.prevent="getKeyboardShortcuts" 
       tabindex="0"
       ref="container">
    <div class="w-full max-w-3xl mx-auto overflow-hidden rounded-lg shadow-xl bg-neutral-900">
      <!-- Header with stats and progress -->
      <div class="border-b border-neutral-800">
        <!-- Progress bar -->
        <div class="h-1 bg-neutral-800">
          <div class="h-full transition-all duration-300 bg-pink-600"
               :style="{ width: `${stats ? (stats.completedCards / (stats.completedCards + stats.remainingCards) * 100) : 0}%` }">
          </div>
        </div>
        
        <div class="flex items-center justify-between p-4">
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
      </div>

      <!-- Main content -->
      <div class="p-6">
        <template v-if="!isLoading && currentCard">
          <!-- Card content - now with fixed height -->
          <div class="space-y-6 panel min-h-[300px]">
            <div class="absolute font-mono text-sm top-2 right-2 text-neutral-500">
              {{ formattedTime }}
            </div>
            
            <!-- Front content (always visible) -->
            <div class="p-4 rounded-lg">
              <div class="mb-2 text-sm font-medium text-neutral-400">Front</div>
              <div class="whitespace-pre-wrap">{{ currentCard.front_content }}</div>
            </div>
            
            <!-- Back content (visible after flip) -->
            <template v-if="isFlipped">
              <div class="h-px bg-neutral-800"></div>
              <div class="p-4 rounded-lg">
                <div class="mb-2 text-sm font-medium text-neutral-400">Back</div>
                <div class="whitespace-pre-wrap">{{ currentCard.back_content }}</div>
              </div>
            </template>
          </div>

          <!-- Buttons below card -->
          <div class="flex justify-center mt-6">
            <!-- Show answer button when not flipped -->
            <button v-if="!isFlipped"
                    @click="flipCard"
                    class="px-4 py-2 rounded panel-clickable"
                    title="Space">
              Show Answer
            </button>

            <!-- Rating buttons when flipped -->
            <div v-else 
                 class="flex gap-2">
              <button @click="handleAnswer(Rating.Again)"
                      class="px-4 py-2 text-red-400 rounded panel-clickable hover:text-red-300"
                      title="Shortcut: 1">
                Again
              </button>
              <button @click="handleAnswer(Rating.Hard)"
                      class="px-4 py-2 text-yellow-400 rounded panel-clickable hover:text-yellow-300"
                      title="Shortcut: 2">
                Hard
              </button>
              <button @click="handleAnswer(Rating.Good)"
                      class="px-4 py-2 text-green-400 rounded panel-clickable hover:text-green-300"
                      title="Shortcut: 3">
                Good
              </button>
              <button @click="handleAnswer(Rating.Easy)"
                      class="px-4 py-2 text-blue-400 rounded panel-clickable hover:text-blue-300"
                      title="Shortcut: 4">
                Easy
              </button>
            </div>
          </div>
        </template>

        <!-- Session complete -->
        <template v-else-if="!isLoading && !currentCard">
          <div class="py-12 text-center">
            <h3 class="mb-2 text-xl font-semibold">Session Complete!</h3>
            <p class="mb-6 text-neutral-400">
              You've reviewed {{ stats?.completedCards }} cards
            </p>
            <button @click="endSession"
                    class="px-4 py-2 panel-clickable">
              Close Session
            </button>
          </div>
        </template>

        <!-- Updated loading state -->
        <div v-else class="flex items-center justify-center min-h-[300px] text-neutral-500">
          <LoadingSpinner :size="32" />
        </div>
      </div>
    </div>
  </div>
</template>