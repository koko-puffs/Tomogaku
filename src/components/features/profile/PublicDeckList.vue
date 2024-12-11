<script setup lang="ts">
import {
  GitFork,
  Layers3,
  Heart
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { Deck } from '../../../types/deck.types';

defineProps<{
  decks: Deck[];
}>();

const router = useRouter();

const navigateToDeck = (deckId: string, event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('.icon-action')) {
    return;
  }
  router.push(`/discover/deck/${deckId}`);
};
</script>

<template>
  <div class="flex flex-col h-full space-y-2">
    <div v-if="decks.length > 0" class="flex flex-col flex-1 gap-2">
      <div v-for="deck in decks" :key="deck.id"
        class="relative w-full panel-clickable min-h-[74px] p-3 pr-3.5 motion-translate-y-in-[-5%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity flex flex-col flex-1 hover:bg-neutral-800/50"
        @click="navigateToDeck(deck.id, $event)">
        <!-- Title row with stats -->
        <div class="flex items-center justify-between w-full gap-8 ">
          <div class="flex items-center min-w-0 gap-1 font-medium group">
            <span class="min-w-0 truncate">{{ deck.title }}</span>
            <div class="flex flex-shrink-0 gap-2">
              <GitFork v-if="deck.is_forked" :size="17" class="text-neutral-400" />
            </div>
          </div>

          <div class="flex items-center flex-shrink-0 gap-4 text-sm md:gap-6 text-neutral-400">
            <div class="flex items-center gap-1.5">
              <Layers3 :size="17" />
              <span class="-mb-0.5">{{ deck.card_count }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <GitFork :size="17" />
              <span class="-mb-0.5">{{ deck.fork_count }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Heart :size="17" />
              <span class="-mb-0.5">{{ deck.likes_count }}</span>
            </div>
          </div>
        </div>

        <!-- Tags row -->
        <div v-if="deck.tags && deck.tags.length > 0" 
          class="flex gap-2 mt-2 overflow-hidden">
          <span v-for="tag in deck.tags" :key="tag"
            class="flex-shrink-0 px-2 py-0.5 text-xs rounded-md bg-neutral-800 text-neutral-400 whitespace-nowrap">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="p-3 text-center panel text-neutral-400">
      No public decks found
    </div>
  </div>
</template>