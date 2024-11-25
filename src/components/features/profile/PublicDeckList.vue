<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  GitFork,
  Globe2,
  Layers3,
  Heart
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useDeckStore } from '../../../stores/deckStore';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

const props = defineProps<{
  userId: string;
}>();

const router = useRouter();
const deckStore = useDeckStore();
const loading = ref(true);

const navigateToDeck = (deckId: string, event: MouseEvent) => {
  // Check if the click was on an icon or button
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('.icon-action')) {
    return; // Don't navigate if clicking on a button or icon
  }
  router.push(`/discover/deck/${deckId}`);
};

onMounted(async () => {
  loading.value = true;
  try {
    await deckStore.fetchPublicDecksByUserId(props.userId);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-2">
    <div v-if="loading" class="flex justify-center mt-14 text-neutral-500">
      <LoadingSpinner size="24" />
    </div>

    <div v-else>
      <div v-if="deckStore.decks.length > 0" class="grid grid-cols-1 gap-2 h-28 md:grid-cols-2">
        <div v-for="deck in deckStore.decks" :key="deck.id"
          class="relative panel-clickable p-3 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity flex flex-col h-[7.55rem] cursor-pointer hover:bg-neutral-800/50"
          @click="navigateToDeck(deck.id, $event)">
          <!-- Top content wrapper -->
          <div class="flex flex-col flex-grow">
            <!-- Header with Title and Icons -->
            <div class="flex items-start justify-between mb-2">
              <div class="relative flex items-center gap-1 font-medium group">
                <span class="truncate max-w-[260px]">{{ deck.title }}</span>
              </div>
              <div class="flex gap-2">
                <Globe2 :size="17" class="text-neutral-400 hover:text-neutral-300 icon-action" />
                <GitFork v-if="deck.is_forked" :size="17" class="text-neutral-400 hover:text-neutral-300 icon-action" />
              </div>
            </div>

            <!-- Tags if exist -->
            <div v-if="deck.tags && deck.tags.length > 0" class="flex gap-2 overflow-hidden">
              <div class="flex gap-2 overflow-hidden">
                <span v-for="tag in deck.tags" :key="tag"
                  class="flex-shrink-0 px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom content wrapper -->
          <div class="mt-auto">
            <!-- Divider -->
            <div class="w-full h-px my-3 bg-neutral-800"></div>

            <!-- Stats -->
            <div class="flex items-center justify-between gap-6 text-sm px-14 text-neutral-400">
              <div class="flex items-center gap-1.5">
                <Layers3 :size="17" class="icon-action" />
                <span class="-mb-0.5">{{ deck.card_count }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <GitFork :size="17" class="icon-action" />
                <span class="-mb-0.5">{{ deck.fork_count }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Heart :size="17" class="icon-action" />
                <span class="-mb-0.5">{{ deck.likes_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-3 text-center panel text-neutral-400">
        No public decks found
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-action {
  pointer-events: none;
}
</style>