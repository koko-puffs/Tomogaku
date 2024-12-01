<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useFSRSStore } from '../../../stores/fsrsStore';
import { useDeckStore } from '../../../stores/deckStore';
import { useAuthStore } from '../../../stores/authStore';
import { Rating } from 'ts-fsrs';
import type { Card } from '../../../types/deck.types';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import StudyCard from './StudyCard.vue';
import { useCardStats } from '../../../composables/useCardStats';
import { State } from 'ts-fsrs';
import { X } from 'lucide-vue-next';

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

const handleCardFlip = (flipped: boolean) => {
  isFlipped.value = flipped;
  if (flipped) {
    cardFlipTime.value = Date.now();
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
    }
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
    isFlipped.value = false;
    
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

const getKeyboardShortcuts = (e: KeyboardEvent) => {
  if (!currentCard.value) return;
  
  // Only handle if not typing in an input/textarea
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  
  switch(e.key) {
    case ' ': // Space key
      if (!isFlipped.value) {
        e.preventDefault();
        studyCardRef.value?.flipCard();
      }
      break;
    case '1':
      if (isFlipped.value) {
        e.preventDefault();
        handleAnswer(Rating.Again);
      }
      break;
    case '2':
      if (isFlipped.value) {
        e.preventDefault();
        handleAnswer(Rating.Hard);
      }
      break;
    case '3':
      if (isFlipped.value) {
        e.preventDefault();
        handleAnswer(Rating.Good);
      }
      break;
    case '4':
      if (isFlipped.value) {
        e.preventDefault();
        handleAnswer(Rating.Easy);
      }
      break;
  }
};

onMounted(() => {
  nextTick(() => {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
  });
  window.addEventListener('keydown', getKeyboardShortcuts);
  startSession();
});

onUnmounted(() => {
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');
  window.removeEventListener('keydown', getKeyboardShortcuts);
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

// Add ref for StudyCard component
const studyCardRef = ref<InstanceType<typeof StudyCard> | null>(null);
</script>

<template>
  <div class="fixed inset-0 flex items-start justify-center p-4 mt-14 md:mt-24 bg-neutral-950/90" 
       @keydown.prevent="getKeyboardShortcuts" 
       tabindex="0"
       ref="container">
    <div class="w-full max-w-3xl min-h-[500px] h-full max-h-[800px] mx-auto overflow-hidden panel shadow-xl bg-neutral-900 motion-translate-y-in-[-1%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
      <!-- Header with stats and progress -->
      <div class="border-b border-neutral-800">
        <!-- Progress bar -->
        <div class="h-1 bg-neutral-800">
          <div class="h-full transition-all duration-300 bg-gradient-to-r from-pink-400/70 to-rose-400/70"
               :style="{ width: `${stats ? (stats.completedCards / (stats.completedCards + stats.remainingCards) * 100) : 0}%` }">
          </div>
        </div>
        
        <div class="flex items-center justify-between p-3">
          <div class="w-20 pl-1 font-mono text-neutral-500">
            {{ isFlipped ? formattedTime : '' }}
          </div>
          
          <div class="absolute flex items-center gap-1 text-sm -translate-x-1/2 left-1/2 text-neutral-400">
            <span :class="{ 
              'text-cyan-400': cardStats.availableNewCards.value > 0,
              'text-neutral-400': cardStats.availableNewCards.value === 0,
              'underline underline-offset-4': currentCardType === 'new'
            }">
              {{ cardStats.availableNewCards }}
            </span>
            <span>+</span>
            <span :class="{ 
              'text-green-400': cardStats.dueReviewCards.value > 0,
              'text-neutral-400': cardStats.dueReviewCards.value === 0,
              'underline underline-offset-4': currentCardType === 'review'
            }">
              {{ cardStats.dueReviewCards }}
            </span>
            <span>+</span>
            <span :class="{ 
              'text-orange-400': cardStats.dueLearningCards.value > 0,
              'text-neutral-400': cardStats.dueLearningCards.value === 0,
              'underline underline-offset-4': currentCardType === 'learning'
            }">
              {{ cardStats.dueLearningCards }}
            </span>
          </div>
          
          <div class="flex justify-end w-20">
            <button @click="endSession" 
                    class="p-2 rounded-lg hover:bg-neutral-800">
              <X :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div class="p-6 flex-1 h-[calc(100%-128px)]">
        <!-- Card area with consistent height -->
        <div class="h-full">
          <template v-if="!isLoading && currentCard">
            <StudyCard 
              ref="studyCardRef"
              :card="currentCard"
              @flipped="handleCardFlip"
              class="h-full"
            />

            <!-- Rating buttons -->
            <div v-if="cardFlipTime" 
                 class="flex justify-center gap-2 mt-6">
              <button @click="handleAnswer(Rating.Again)"
                      class="gap-1.5 w-24 button-lighter-visible"
                      title="Shortcut: 1">
                Again
                <span class="text-xs opacity-60" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Again].card.scheduled_days,
                    new Date(schedules[Rating.Again].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Hard)"
                      class="gap-1.5 w-24 button-lighter-visible"
                      title="Shortcut: 2">
                Hard
                <span class="text-xs opacity-60" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Hard].card.scheduled_days,
                    new Date(schedules[Rating.Hard].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Good)"
                      class="gap-1.5 w-24 button-lighter-visible"
                      title="Shortcut: 3">
                Good
                <span class="text-xs opacity-60" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Good].card.scheduled_days,
                    new Date(schedules[Rating.Good].card.due)
                  ) }}
                </span>
              </button>
              <button @click="handleAnswer(Rating.Easy)"
                      class="gap-1.5 w-24 button-lighter-visible"
                      title="Shortcut: 4">
                Easy
                <span class="text-xs opacity-60" v-if="schedules">
                  {{ formatSchedule(
                    schedules[Rating.Easy].card.scheduled_days,
                    new Date(schedules[Rating.Easy].card.due)
                  ) }}
                </span>
              </button>
            </div>
          </template>

          <!-- Loading state-->
          <div v-else-if="isLoading" 
               class="flex items-center justify-center h-full text-neutral-500">
            <LoadingSpinner :size="32" />
          </div>

          <!-- Session complete -->
          <template v-else-if="!currentCard">
            <div class="flex flex-col items-center justify-center h-full">
              <h3 class="mb-2 text-xl font-semibold">Session Complete!</h3>
              <p class="mb-6 text-neutral-400">
                You've reviewed {{ stats?.completedCards }} card(s)
              </p>
              <button @click="endSession"
                      class="px-4 button-lighter-visible">
                Close Session
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>