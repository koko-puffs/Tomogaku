<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useDeckStore } from '../../stores/deckStore';
import PageLayout from '../../components/common/PageLayout.vue';
import { useRoute, useRouter } from 'vue-router';
import CreateDeckModal from '../../components/features/decks/CreateDeckModal.vue';
import DeleteDeckModal from '../../components/features/decks/DeleteDeckModal.vue';
  import DeckList from '../../components/features/decks/DeckList.vue';
import DeckDetails from '../../components/features/decks/DeckDetails.vue';
import CommentSection from '../../components/features/decks/CommentSection.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';

defineProps<{
  deckId?: string;
}>();

const router = useRouter();
const route = useRoute();
const deckStore = useDeckStore();
const selectedDeck = ref<string | null>(null);
const isLoading = ref(true);

const selectDeck = async (deckId: string) => {
  try {
    isLoading.value = true;
    selectedDeck.value = deckId;
    
    // First check if we already have the deck
    let deck = deckStore.getDeckById(deckId);
    
    if (!deck) {
      // Fetch both deck and cards if we don't have the deck
      await Promise.all([
        deckStore.fetchDeckById(deckId),
        deckStore.fetchCards(deckId)
      ]);
      deck = deckStore.getDeckById(deckId);
    } else {
      // If we have the deck, just ensure cards are loaded
      await deckStore.fetchCards(deckId);
    }
    
    if (!deck) {
      console.error(`Deck ${deckId} not found after fetching`);
      selectedDeck.value = null;
      router.push('/learn');
      return;
    }
    
    // Only update route if we're not already there
    if (route.params.deckId !== deckId) {
      await router.push(`/learn/${deckId}`);
    }

    scrollToTop();
  } catch (error) {
    console.error('Error in selectDeck:', error);
    selectedDeck.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (route.params.deckId) {
    await selectDeck(route.params.deckId as string);
  } else {
    isLoading.value = false;
  }
});

watch(
  [() => route.params.deckId, () => deckStore.userDecks],
  async ([newDeckId, decks]) => {
    if (newDeckId) {
      if (selectedDeck.value !== newDeckId) {
        selectedDeck.value = newDeckId as string;
      }
    } else if (decks.length > 0 && !selectedDeck.value) {
      await selectDeck(decks[0].id);
    } else if (decks.length === 0) {
      selectedDeck.value = null;
    }
  },
  { immediate: true }
);

const deleteDeckModalRef = ref();

const handleDeleteDeck = async () => {
  if (!selectedDeck.value) return;
  deleteDeckModalRef.value?.openModal();
};

const confirmDeleteDeck = async () => {
  if (!selectedDeck.value) return;

  try {
    await deckStore.deleteDeck(selectedDeck.value);
    selectedDeck.value = null;
    router.push('/learn');
  } catch (error) {
    console.error('Failed to delete deck:', error);
  }
};

const createDeckModalRef = ref();

const openCreateDeckModal = () => {
  createDeckModalRef.value?.openModal();
};

const handleEditDeck = async (updates: { title: string, description: string | null, tags: string[] | null }) => {
  if (!selectedDeck.value) return;

  try {
    await deckStore.updateDeck(selectedDeck.value, updates);
  } catch (error) {
    console.error('Failed to update deck:', error);
  }
};

const handleStudyDeck = () => {
  // Implement study functionality
};

const handleViewCards = () => {
  // Implement view cards functionality
};

const currentDeck = computed(() =>
  selectedDeck.value ? deckStore.getDeckById(selectedDeck.value) : null
);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
</script>

<template>
  <div class="motion-preset-fade motion-duration-150">
    <!-- Gradient overlay -->
    <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-pink-950/5 to-transparent"></div>
    <PageLayout>
        <!-- <template #header>
          <div class="flex items-center justify-between w-full">
            Test Header Content
          </div>
        </template> -->

      <template #sidebar>
        <DeckList :selected-deck="selectedDeck" @select-deck="selectDeck" @create-deck="openCreateDeckModal" />
      </template>

      <template #content>
        <div v-if="isLoading" class="flex items-center justify-center mt-20 text-neutral-500">
          <LoadingSpinner :size="32" />
        </div>
        <div v-else-if="currentDeck" class="space-y-6">
          <DeckDetails :deck="currentDeck" @update="handleEditDeck" @delete="handleDeleteDeck" @study="handleStudyDeck"
            @cards="handleViewCards" />
          <template v-if="currentDeck.visibility !== 'private'">
            <CommentSection :deck-id="currentDeck.id" />
          </template>
        </div>
        <div v-else class="flex items-center justify-center mt-16 text-neutral-500">
          Select a deck to view details
        </div>
      </template>
    </PageLayout>
  </div>
  <CreateDeckModal ref="createDeckModalRef" />
  <DeleteDeckModal ref="deleteDeckModalRef" @confirm="confirmDeleteDeck" />
</template>