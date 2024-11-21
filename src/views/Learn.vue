<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useDeckStore } from '../stores/deckStore';
import { useUsersStore } from '../stores/usersStore';
import PageLayout from '../components/common/PageLayout.vue';
import { useRoute, useRouter } from 'vue-router';
import CreateDeckModal from '../components/features/decks/CreateDeckModal.vue';
import DeleteDeckModal from '../components/features/decks/DeleteDeckModal.vue';
import DeckList from '../components/features/decks/DeckList.vue';
import DeckDetails from '../components/features/decks/DeckDetails.vue';
import CommentSection from '../components/features/decks/CommentSection.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';

defineProps<{
  deckId?: string;
}>();

const router = useRouter();
const route = useRoute();
const deckStore = useDeckStore();
const usersStore = useUsersStore();
const selectedDeck = ref<string | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  const deckId = route.params.deckId as string;
  if (deckId) {
    await selectDeck(deckId);
  }
  isLoading.value = false;
});

watch(
  () => route.params.deckId,
  async (newDeckId) => {
    if (newDeckId) {
      selectedDeck.value = newDeckId as string;
    } else {
      selectedDeck.value = null;
    }
  }
);

const selectDeck = async (deckId: string) => {
  selectedDeck.value = deckId;
  await router.push(`/learn/${deckId}`);
  
  isLoading.value = false;
  
  deckStore.fetchCards(deckId);
  usersStore.fetchDeckCommentsWithProfiles(deckId);
};

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

const handleEditDeck = () => {
  // Implement edit functionality
};

const handleStudyDeck = () => {
  // Implement study functionality
};

const currentDeck = computed(() => 
  selectedDeck.value ? deckStore.getDeckById(selectedDeck.value) : null
);
</script>

<template>
  <div class="motion-preset-fade motion-duration-150">
    <PageLayout>
      <template #sidebar>
        <DeckList :selected-deck="selectedDeck" @select-deck="selectDeck" @create-deck="openCreateDeckModal" />
      </template>

      <template #content>
        <div v-if="isLoading" class="flex items-center justify-center mt-16 text-neutral-500">
          <LoadingSpinner :size="36" />
        </div>
        <div v-else-if="currentDeck" class="space-y-2">
          <DeckDetails 
            :deck="currentDeck" 
            @edit="handleEditDeck" 
            @delete="handleDeleteDeck"
            @study="handleStudyDeck" 
          />
          <div v-if="usersStore.loading.comments" class="flex items-center justify-center py-8 text-neutral-500">
            <LoadingSpinner :size="24" />
          </div>
          <CommentSection v-else :deck-id="currentDeck.id" />
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