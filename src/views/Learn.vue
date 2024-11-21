<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDeckStore } from '../stores/deckStore';
import { useUsersStore } from '../stores/usersStore';
import { useAuthStore } from '../stores/authStore';
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
const authStore = useAuthStore();
const selectedDeck = ref<string | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  const deckId = route.params.deckId as string;
  if (deckId) {
    await selectDeck(deckId);
  }
  isLoading.value = false;
});

const selectDeck = async (deckId: string) => {
  isLoading.value = true;
  selectedDeck.value = deckId;
  await router.push(`/learn/${deckId}`);
  await Promise.all([
    deckStore.fetchDecksByUserId(authStore.user?.id || ''),
    deckStore.fetchCards(deckId),
    usersStore.fetchDeckCommentsWithProfiles(deckId)
  ]);
  isLoading.value = false;
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
        <div v-else-if="selectedDeck && deckStore.getDeckById(selectedDeck)" class="space-y-2">
          <DeckDetails 
            :deck="deckStore.getDeckById(selectedDeck)" 
            @edit="handleEditDeck" 
            @delete="handleDeleteDeck"
            @study="handleStudyDeck" 
          />
          <CommentSection :deck-id="selectedDeck" />
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