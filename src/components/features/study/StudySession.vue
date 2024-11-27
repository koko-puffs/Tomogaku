<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDeckStore } from '../../../stores/deckStore';
import { ArrowLeft, ThumbsUp, ThumbsDown, Zap, Rocket } from 'lucide-vue-next';
// Import Quill CSS
import '../../../styles/quill.css';

const props = defineProps<{
  deckId: string;
}>();

const emit = defineEmits<{
  'close': [];
}>();

const deckStore = useDeckStore();
const showAnswer = ref(false);

// Start study session when component mounts
deckStore.startStudySession(props.deckId);

const currentCard = computed(() => deckStore.currentCard);
const progress = computed(() => deckStore.studyProgress);

const handleShowAnswer = () => {
  showAnswer.value = true;
};

const handleResponse = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
  if (!currentCard.value) return;
  
  await deckStore.recordCardReview(currentCard.value.id, rating);
  showAnswer.value = false;
};

const getButtonClass = (rating: string) => {
  const baseClass = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors';
  switch (rating) {
    case 'again':
      return `${baseClass} bg-red-500/10 hover:bg-red-500/20 text-red-400`;
    case 'hard':
      return `${baseClass} bg-orange-500/10 hover:bg-orange-500/20 text-orange-400`;
    case 'good':
      return `${baseClass} bg-green-500/10 hover:bg-green-500/20 text-green-400`;
    case 'easy':
      return `${baseClass} bg-blue-500/10 hover:bg-blue-500/20 text-blue-400`;
    default:
      return baseClass;
  }
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-neutral-800">
      <button class="flex items-center gap-2 text-neutral-400 hover:text-neutral-200" @click="emit('close')">
        <ArrowLeft :size="20" />
        <span>Exit</span>
      </button>
      <div class="text-neutral-400">
        {{ progress.completed }} / {{ progress.total }}
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="currentCard" class="flex-1 p-4">
      <!-- Question Side -->
      <div class="max-w-2xl mx-auto space-y-8">
        <div class="ql-snow">
          <div class="p-6 !rounded-lg ql-editor ql-container border-none !bg-neutral-900">
            <div v-html="currentCard.front_content"></div>
          </div>
        </div>

        <!-- Answer Side -->
        <div v-if="showAnswer" class="ql-snow">
          <div class="p-6 !rounded-lg ql-editor ql-container border-none !bg-neutral-900">
            <div v-html="currentCard.back_content"></div>
          </div>
        </div>

        <!-- Response Buttons -->
        <div class="flex justify-center gap-2">
          <template v-if="!showAnswer">
            <button 
              class="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              @click="handleShowAnswer"
            >
              Show Answer
            </button>
          </template>
          <template v-else>
            <button :class="getButtonClass('again')" @click="handleResponse('again')">
              <ThumbsDown :size="18" />
              <span>Again</span>
            </button>
            <button :class="getButtonClass('hard')" @click="handleResponse('hard')">
              <Zap :size="18" />
              <span>Hard</span>
            </button>
            <button :class="getButtonClass('good')" @click="handleResponse('good')">
              <ThumbsUp :size="18" />
              <span>Good</span>
            </button>
            <button :class="getButtonClass('easy')" @click="handleResponse('easy')">
              <Rocket :size="18" />
              <span>Easy</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Session Complete -->
    <div v-else class="flex items-center justify-center flex-1">
      <div class="space-y-4 text-center">
        <h2 class="text-2xl font-bold text-neutral-200">Session Complete!</h2>
        <p class="text-neutral-400">You've reviewed all cards for now.</p>
        <button 
          class="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          @click="emit('close')"
        >
          Return to Deck
        </button>
      </div>
    </div>
  </div>
</template>