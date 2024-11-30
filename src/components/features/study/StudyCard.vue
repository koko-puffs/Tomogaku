<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Card } from '../../../types/deck.types';

const props = defineProps<{
  card: Card;
}>();

const emit = defineEmits<{
  (e: 'flipped'): void;
}>();

const isFlipped = ref(false);

const flipCard = () => {
  isFlipped.value = true;
  emit('flipped');
};

// Reset flip state when card changes
watch(() => props.card, () => {
  isFlipped.value = false;
}, { immediate: true });
</script>

<template>
  <div class="space-y-6">
    <!-- Card content -->
    <div class="space-y-6 panel min-h-[500px]">
      <!-- Front content (always visible) -->
      <div class="p-4 rounded-lg">
        <div class="mb-2 text-sm font-medium text-neutral-400">Front</div>
        <div class="whitespace-pre-wrap">{{ card.front_content }}</div>
      </div>
      
      <!-- Back content (visible after flip) -->
      <template v-if="isFlipped">
        <div class="h-px bg-neutral-800"></div>
        <div class="p-4 rounded-lg">
          <div class="mb-2 text-sm font-medium text-neutral-400">Back</div>
          <div class="whitespace-pre-wrap">{{ card.back_content }}</div>
        </div>
      </template>
    </div>

    <!-- Show answer button -->
    <div v-if="!isFlipped" class="flex justify-center">
      <button @click="flipCard"
              class="px-4 py-2 rounded panel-clickable"
              title="Space">
        Show Answer
      </button>
    </div>
  </div>
</template>