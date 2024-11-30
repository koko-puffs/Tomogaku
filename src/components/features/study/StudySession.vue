<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useFSRSStore } from '../../../stores/fsrsStore';
import { useDeckStore } from '../../../stores/deckStore';
import { useAuthStore } from '../../../stores/authStore';
import { Rating } from 'ts-fsrs';
import type { Card } from '../../../types/deck.types';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import StudyCard from './StudyCard.vue';
import { useCardStats } from '../../../composables/useCardStats';
import { State } from 'ts-fsrs';

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

const formattedTime = computed(() => {
  const seconds = Math.floor(elapsedTime.value / 1000);
  const milliseconds = Math.floor((elapsedTime.value % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
});

const updateTimer = () => {
  if (!isFlipped.value) {
    elapsedTime.value = Date.now() - cardStartTime.value;
  }
};

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

const handleCardFlip = () => {
  cardFlipTime.value = Date.now();
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
};

const handleAnswer = async (rating: Rating) => {
  if (!currentCard.value || !authStore.user) return;

  try {
    isLoading.value = true;
    const reviewDuration = cardFlipTime.value - cardStartTime.value;
    await fsrsStore.processReview(currentCard.value, rating, authStore.user.id, reviewDuration);
    
    await deckStore.updateDeckStats(props.deckId);
    
    currentCard.value = fsrsStore.getNextCard();
    if (currentCard.value) {
      cardFlipTime.value = 0;
      cardStartTime.value = Date.now();
      elapsedTime.value = 0;
      if (timerInterval.value) clearInterval(timerInterval.value);
      timerInterval.value = window.setInterval(updateTimer, 10);
    }
    
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

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden');
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

// Add this to ensure focus when mounted
const container = ref<HTMLElement | null>(null);

// Add card stats
const cardStats = useCardStats(props.deckId);

// Add computed for current card type
const currentCardType = computed(() => {
  if (!currentCard.value) return null;
  
  if (currentCard.value.state === State.New) return 'new';
  if (currentCard.value.state === State.Learning || currentCard.value.state === State.Relearning) return 'learning';
  if (currentCard.value.state === State.Review) return 'review';
  return null;
});

// Add computed for schedules
const schedules = computed(() => {
  if (!currentCard.value) return null;
  return fsrsStore.getSchedule(currentCard.value);
});

const formatSchedule = (days: number, dueDate: Date) => {
  // For intervals less than 1 day, use due date
  if (days < 1) {
    const minutesUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60);
    return `<${Math.max(1, Math.round(minutesUntilDue))}m`;
  }

  // For longer intervals, use scheduled days
  const months = days / 30;
  const years = days / 365;

  if (days < 30) {
    return `${Math.round(days)}d`;
  } else if (days < 365) {
    return `${Math.round(months)}mo`;
  } else {
    return `${Math.round(years)}y`;
  }
};
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
          <div class="flex items-center gap-4 text-sm">
            <div class="flex gap-4">
              <span :class="{
                'text-cyan-400': currentCardType === 'new',
                'text-neutral-400': currentCardType !== 'new'
              }">
                New: {{ cardStats.availableNewCards }}
              </span>
              <span :class="{
                'text-green-400': currentCardType === 'review',
                'text-neutral-400': currentCardType !== 'review'
              }">
                Review: {{ cardStats.dueReviewCards }}
              </span>
              <span :class="{
                'text-orange-400': currentCardType === 'learning',
                'text-neutral-400': currentCardType !== 'learning'
              }">
                Learning: {{ cardStats.dueLearningCards }}
              </span>
            </div>
            <div class="font-mono text-neutral-500">
              {{ formattedTime }}
            </div>
          </div>
          <button @click="endSession" 
                  class="text-neutral-400 hover:text-neutral-200">
            Close
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div class="p-6">
        <!-- Card area with consistent height -->
        <div class="min-h-[562px]">
          <template v-if="!isLoading && currentCard">
            <StudyCard 
              :card="currentCard"
              @flipped="handleCardFlip"
            />

            <!-- Rating buttons -->
            <div v-if="cardFlipTime" 
                 class="flex justify-center gap-2 mt-6">
              <button @click="handleAnswer(Rating.Again)"
                      class="px-4 py-2 text-red-400 rounded panel-clickable hover:text-red-300"
                      title="Shortcut: 1">
                Again
                <span class="text-xs opacity-75" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Again].card.scheduled_days,
                    new Date(schedules[Rating.Again].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Hard)"
                      class="px-4 py-2 text-yellow-400 rounded panel-clickable hover:text-yellow-300"
                      title="Shortcut: 2">
                Hard
                <span class="text-xs opacity-75" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Hard].card.scheduled_days,
                    new Date(schedules[Rating.Hard].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Good)"
                      class="px-4 py-2 text-green-400 rounded panel-clickable hover:text-green-300"
                      title="Shortcut: 3">
                Good
                <span class="text-xs opacity-75" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Good].card.scheduled_days,
                    new Date(schedules[Rating.Good].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Easy)"
                      class="px-4 py-2 text-blue-400 rounded panel-clickable hover:text-blue-300"
                      title="Shortcut: 4">
                Easy
                <span class="text-xs opacity-75" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Easy].card.scheduled_days,
                    new Date(schedules[Rating.Easy].card.due)
                  ) }}
                </span>
              </button>
            </div>
          </template>

          <!-- Loading state with same height as card -->
          <div v-else-if="isLoading" 
               class="flex items-center justify-center h-[300px] text-neutral-500">
            <LoadingSpinner :size="32" />
          </div>

          <!-- Session complete -->
          <template v-else-if="!currentCard">
            <div class="flex flex-col items-center justify-center h-[300px]">
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
        </div>
      </div>
    </div>
  </div>
</template>