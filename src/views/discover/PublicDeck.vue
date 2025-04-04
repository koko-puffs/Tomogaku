<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDeckStore } from '../../stores/deckStore';
import { useSocialStore } from '../../stores/socialStore';
import { useUsersStore } from '../../stores/usersStore';
import PageLayoutMirrored from '../../components/common/PageLayoutMirrored.vue';
import PublicDeckDetails from '../../components/features/profile/PublicDeckDetails.vue';
import CommentSection from '../../components/features/decks/CommentSection.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import DeleteModal from '../../components/common/DeleteModal.vue';

const props = defineProps<{
    id: string;
}>();

const router = useRouter();
const deckStore = useDeckStore();
const socialStore = useSocialStore();
const usersStore = useUsersStore();
const loading = ref(true);
const error = ref<string | null>(null);

const fetchDeckData = async () => {
    loading.value = true;
    error.value = null;

    try {
        // Fetch the deck and ensure it's public
        const deck = await deckStore.fetchDeckById(props.id);

        if (!deck) {
            router.push({ name: 'notFound' });
            return;
        }

        if (deck.visibility !== 'public') {
            router.push({ name: 'notFound' });
            return;
        }

        // Fetch additional data
        await Promise.all([
            usersStore.fetchUserProfile(deck.user_id),
            socialStore.fetchDeckLikes([deck.id]),
        ]);

    } catch (e) {
        router.push({ name: 'notFound' });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchDeckData();
});

watch(() => props.id, (newId) => {
    if (newId) {
        fetchDeckData();
    }
});

const currentDeck = computed(() => deckStore.getDeckById(props.id));

// Add delete modal state and handlers
const deleteModalRef = ref();

const handleDeleteDeck = () => {
    deleteModalRef.value?.openModal();
};

const confirmDeleteDeck = async () => {
    try {
        await deckStore.deleteDeck(props.id);
        router.push('/discover');
    } catch (error) {
        console.error('Failed to delete deck:', error);
    }
};

// Add edit handler
const handleEditDeck = async (updates: {
    title: string,
    description: string | null,
    tags: string[] | null,
    visibility: 'private' | 'public'
}) => {
    if (!currentDeck.value) return;

    try {
        await deckStore.updateDeck(currentDeck.value.id, updates);
    } catch (error) {
        console.error('Failed to update deck:', error);
    }
};
</script>

<template>
    <div>
        <!-- Gradient overlay -->
        <div class="absolute inset-0 z-[20] pointer-events-none bg-gradient-to-b from-emerald-950/5 to-transparent">
        </div>
        <PageLayoutMirrored>
            <template #content>
                <div class="max-w-3xl mx-auto">
                    <div v-if="loading" class="flex items-center justify-center mt-20 text-neutral-500">
                        <LoadingSpinner :size="32" />
                    </div>

                    <div v-else-if="error" class="text-center text-red-500">
                        {{ error }}
                    </div>

                    <div v-else-if="currentDeck" class="space-y-6">
                        <PublicDeckDetails :deck="currentDeck" @delete="handleDeleteDeck" @update="handleEditDeck" />
                        <CommentSection :deck-id="currentDeck.id" />
                    </div>
                </div>
            </template>
        </PageLayoutMirrored>
    </div>

    <DeleteModal ref="deleteModalRef" @confirm="confirmDeleteDeck" title="Delete Deck?"
        mainMessage="Deleting this deck will also delete all the cards in it."
        subMessage="This action cannot be undone." />
</template>