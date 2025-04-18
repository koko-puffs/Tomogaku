<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useDeckStore } from '../../stores/deckStore';
import { useCardStore } from '../../stores/cardStore';
import PageLayout from '../../components/common/PageLayout.vue';
import { useRoute, useRouter } from 'vue-router';
import CardList from '../../components/features/cards/CardList.vue';
import CardDetails from '../../components/features/cards/CardDetails.vue';
import DeleteModal from '../../components/common/DeleteModal.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import { ChevronLeft } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import { useFSRSStore } from '../../stores/fsrsStore';

defineProps<{
  deckId: string;
  cardId?: string;
}>();

const router = useRouter();
const route = useRoute();
const deckStore = useDeckStore();
const cardStore = useCardStore();
const fsrsStore = useFSRSStore();
const selectedCard = ref<string | null>(null);
const isLoading = ref(true);

const selectCard = async (cardId: string) => {
  selectedCard.value = cardId;

  // Only update route if we're not already there
  if (route.params.cardId !== cardId) {
    await router.push(`/learn/${route.params.deckId}/cards/${cardId}`);
  }
};

onMounted(async () => {
  try {
    isLoading.value = true;
    await cardStore.fetchCards(route.params.deckId as string);

    // If there's a cardId in the route, use that
    if (route.params.cardId) {
      selectedCard.value = route.params.cardId as string;
    } else {
      // If no card is selected, select the first card if available
      const cards = cardStore.getCardsByDeckId(route.params.deckId as string);
      if (cards.length > 0) {
        await selectCard(cards[0].id);
      }
    }
  } catch (error) {
    console.error('Failed to load cards:', error);
    router.push({ name: 'notFound' });
  } finally {
    isLoading.value = false;
  }
});

const deleteModalRef = ref();

const handleDeleteCard = async () => {
  if (!selectedCard.value) return;
  deleteModalRef.value?.openModal();
};

const confirmDeleteCard = async () => {
  if (!selectedCard.value || !route.params.deckId || !cardListRef.value) return;

  try {
    // Get the current card's index before deletion
    const cards = cardListRef.value.filteredCards;
    const currentIndex = cards.findIndex(card => card.id === selectedCard.value);
    
    // Delete the card
    await cardStore.deleteCard(route.params.deckId as string, selectedCard.value);
    
    // Select the previous card if it exists, otherwise select the next card
    if (currentIndex > 0) {
      // There is a previous card
      await router.push(`/learn/${route.params.deckId}/cards/${cards[currentIndex - 1].id}`);
    } else if (cards.length > 1) {
      // We're deleting the first card, select the new first card
      await router.push(`/learn/${route.params.deckId}/cards/${cards[1].id}`);
    } else {
      // No cards left
      selectedCard.value = null;
      await router.push(`/learn/${route.params.deckId}/cards`);
    }
  } catch (error) {
    console.error('Failed to delete card:', error);
  }
};

const handleCreateCard = async () => {
  const deckId = route.params.deckId as string;
  if (!deckId) return;

  try {
    const newCard = await cardStore.createCard({
      deck_id: deckId,
      front_content: '<h1 class="ql-align-center"><strong></strong></h1>', // Default to be centered and bold
      back_content: '<h2 class="ql-align-center"><strong></strong></h2>', // Default to be centered and bold
    });

    if (newCard) {
      selectedCard.value = newCard.id;
      await router.push(`/learn/${deckId}/cards/${newCard.id}`);
    }
  } catch (error) {
    console.error('Failed to create card:', error);
  }
};

const handleUpdateCard = async (updates: {
  front_content: string;
  back_content: string;
  tags: string[];
  position: number | null;
}) => {
  if (!selectedCard.value || !route.params.deckId) return;

  try {
    await cardStore.updateCard(selectedCard.value, {
      ...updates,
      deck_id: route.params.deckId as string,
    });
  } catch (error) {
    console.error('Failed to update card:', error);
  }
};

const handleDuplicateCard = async () => {
  if (!selectedCard.value || !route.params.deckId) return;

  try {
    const newCard = await cardStore.duplicateCard(selectedCard.value);
    if (newCard) {
      selectedCard.value = newCard.id;
      await router.push(`/learn/${route.params.deckId}/cards/${newCard.id}`);
    }
  } catch (error) {
    console.error('Failed to duplicate card:', error);
  }
};

const navigateToCard = async (cardId: string) => {
  selectedCard.value = cardId;
  await router.push(`/learn/${route.params.deckId}/cards/${cardId}`);
};

const cardListRef = ref<{ filteredCards: any[] } | null>(null);

const handlePreviousCard = () => {
  if (!selectedCard.value || !cardListRef.value) return;

  const cards = cardListRef.value.filteredCards;
  const currentIndex = cards.findIndex(card => card.id === selectedCard.value);

  if (currentIndex > 0) {
    navigateToCard(cards[currentIndex - 1].id);
  }
};

const handleNextCard = () => {
  if (!selectedCard.value || !cardListRef.value) return;

  const cards = cardListRef.value.filteredCards;
  const currentIndex = cards.findIndex(card => card.id === selectedCard.value);

  if (currentIndex < cards.length - 1) {
    navigateToCard(cards[currentIndex + 1].id);
  }
};

const forgetModalRef = ref();

const handleForgetCard = async () => {
  if (!selectedCard.value || !route.params.deckId) return;
  forgetModalRef.value?.openModal();
};

const confirmForgetCard = async () => {
  if (!selectedCard.value || !route.params.deckId) return;

  try {
    const card = cardStore.getCardsByDeckId(route.params.deckId as string)
      .find(c => c.id === selectedCard.value);
    
    if (!card) return;

    await fsrsStore.forgetCard(card);
    // Refresh the cards after forgetting
    await cardStore.fetchCards(route.params.deckId as string);
  } catch (error) {
    console.error('Failed to forget card:', error);
  }
};

// Watch for route changes to update selected card
watch(
  () => route.params.cardId,
  async (newCardId) => {
    if (newCardId && selectedCard.value !== newCardId) {
      selectedCard.value = newCardId as string;
    }
  }
);

const hasPreviousCard = computed(() => {
  if (!selectedCard.value || !cardListRef.value) return false;
  const cards = cardListRef.value.filteredCards;
  const currentIndex = cards.findIndex(card => card.id === selectedCard.value);
  return currentIndex > 0;
});

const hasNextCard = computed(() => {
  if (!selectedCard.value || !cardListRef.value) return false;
  const cards = cardListRef.value.filteredCards;
  const currentIndex = cards.findIndex(card => card.id === selectedCard.value);
  return currentIndex < cards.length - 1;
});
</script>

<template>
  <div>
    <PageLayout>
      <template #sidebar>
        <RouterLink :to="`/learn/${deckId}`"
          class="flex items-center justify-start h-6 gap-2 pr-3 mb-2.5 text-neutral-400 hover:text-neutral-200">
          <ChevronLeft :size="22" />
          <span class="text-sm truncate mt-0.5">
            {{ deckStore.getDeckById(deckId)?.title || 'Loading...' }}
          </span>
        </RouterLink>

        <CardList ref="cardListRef" :deck-id="deckId" :selected-card="selectedCard" @select-card="selectCard"
          @create-card="handleCreateCard" />
      </template>

      <template #content>
        <div v-if="isLoading" class="flex items-center justify-center mt-20 text-neutral-500">
          <LoadingSpinner :size="32" />
        </div>
        <div v-else-if="selectedCard && cardStore.getCardsByDeckId(deckId).find(card => card.id === selectedCard)"
          class="space-y-6">
          <CardDetails :card="cardStore.getCardsByDeckId(deckId).find(card => card.id === selectedCard)!"
            :has-previous="hasPreviousCard"
            :has-next="hasNextCard"
            @update="handleUpdateCard" 
            @delete="confirmDeleteCard" 
            @delete-with-modal="handleDeleteCard" 
            @duplicate="handleDuplicateCard"
            @previous="handlePreviousCard" 
            @next="handleNextCard"
            @forget="handleForgetCard" />
        </div>
        <div v-else class="flex items-center justify-center mt-16 text-neutral-500">
          Select a card to view details
        </div>
      </template>
    </PageLayout>
  </div>

  <DeleteModal ref="deleteModalRef" @confirm="confirmDeleteCard" title="Delete Card?"
    mainMessage="Are you sure you want to delete this card?" subMessage="This action cannot be undone." />

  <DeleteModal ref="forgetModalRef" @confirm="confirmForgetCard" title="Forget Card?" buttonText="Forget"
    :mainMessage="'Are you sure you want to forget this card?' + '\n' + 'Forgetting this card means any FSRS related data will be lost, and the card will be reset to the default new state.'" 
    subMessage="This action cannot be undone." />
</template>