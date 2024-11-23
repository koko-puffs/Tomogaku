<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDeckStore } from '../stores/deckStore';
import { useUsersStore } from '../stores/usersStore';
import PageLayoutMirrored from '../components/common/PageLayoutMirrored.vue';
import PublicDeckDetails from '../components/features/profile/PublicDeckDetails.vue';
import CommentSection from '../components/features/decks/CommentSection.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';

const props = defineProps<{
    id: string;
}>();

const router = useRouter();
const deckStore = useDeckStore();
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
            throw new Error('Deck not found');
        }
        
        if (deck.visibility !== 'public') {
            throw new Error('This deck is private');
        }

        // Fetch additional data
        await Promise.all([
            usersStore.fetchUserProfile(deck.user_id),
            deckStore.fetchDeckLikes([deck.id]),
            usersStore.fetchDeckCommentsWithProfiles(deck.id)
        ]);

    } catch (e) {
        error.value = e instanceof Error ? e.message : 'An error occurred';
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
</script>

<template>
    <div class="motion-preset-fade motion-duration-150">
        <PageLayoutMirrored>
            <template #content>
                <div class="max-w-3xl mx-auto">
                    <div v-if="loading" class="flex items-center justify-center mt-16 text-neutral-500">
                        <LoadingSpinner :size="36" />
                    </div>

                    <div v-else-if="error" class="text-center text-red-500">
                        {{ error }}
                    </div>

                    <div v-else-if="currentDeck" class="space-y-6">
                        <PublicDeckDetails :deck="currentDeck" />
                        
                        <hr class="my-6 border-t border-neutral-800" />
                        
                        <div v-if="usersStore.loading.comments" class="flex items-center justify-center py-8 text-neutral-500">
                            <LoadingSpinner :size="24" />
                        </div>
                        <CommentSection v-else :deck-id="currentDeck.id" />
                    </div>
                </div>
            </template>
        </PageLayoutMirrored>
    </div>
</template>