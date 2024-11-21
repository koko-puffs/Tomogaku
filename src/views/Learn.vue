<script setup lang="ts">
import { ref } from 'vue';
import { useDeckStore } from '../stores/deckStore';
import { useUsersStore } from '../stores/usersStore';
import { Pencil, Trash2, Plus, Info, Heart, MessageSquare } from 'lucide-vue-next';
import PageLayout from '../components/common/PageLayout.vue';
import { useRouter } from 'vue-router';
import CreateDeckModal from '../components/features/decks/CreateDeckModal.vue';

const router = useRouter();
const deckStore = useDeckStore();
const usersStore = useUsersStore();
const selectedDeck = ref<string | null>(null);

// New comment state
const newComment = ref('');
const editingComment = ref<string | null>(null);
const editCommentContent = ref('');

// Add these new refs to the script setup section
const replyingTo = ref<string | null>(null);
const replyContent = ref('');

// Load decks when component mounts
deckStore.fetchDecks();

const selectDeck = async (deckId: string) => {
  selectedDeck.value = deckId;
  await Promise.all([
    deckStore.fetchCards(deckId),
    usersStore.fetchDeckCommentsWithProfiles(deckId)
  ]);
};

// Comment handlers
const addComment = async () => {
  if (!selectedDeck.value || !newComment.value) return;
  try {
    await usersStore.createComment(selectedDeck.value, newComment.value);
    newComment.value = '';
  } catch (error) {
    console.error('Failed to create comment:', error);
  }
};

const startEditComment = (comment: any) => {
  editingComment.value = comment.id;
  editCommentContent.value = comment.content;
};

const updateComment = async () => {
  if (!editingComment.value || !editCommentContent.value) return;
  try {
    await usersStore.updateComment(editingComment.value, editCommentContent.value);
    editingComment.value = null;
    editCommentContent.value = '';
  } catch (error) {
    console.error('Failed to update comment:', error);
  }
};

const toggleCommentLike = async (commentId: string) => {
  try {
    await usersStore.toggleCommentLike(commentId);
  } catch (error) {
    console.error('Failed to toggle like:', error);
  }
};

const handleDeleteDeck = async () => {
  if (!selectedDeck.value) return;
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
    return;
  }

  try {
    await deckStore.deleteDeck(selectedDeck.value);
    selectedDeck.value = null;
    router.push('/learn'); // Return to deck list
  } catch (error) {
    console.error('Failed to delete deck:', error);
  }
};

const createDeckModalRef = ref();

const openCreateDeckModal = () => {
  createDeckModalRef.value?.openModal();
};

// Add this new method
const addReply = async () => {
  if (!selectedDeck.value || !replyingTo.value || !replyContent.value) return;
  try {
    await usersStore.createComment(selectedDeck.value, replyContent.value, replyingTo.value);
    replyContent.value = '';
    replyingTo.value = null;
  } catch (error) {
    console.error('Failed to create reply:', error);
  }
};
</script>

<template>
  <div class="motion-preset-fade motion-duration-150">
    <PageLayout>
      <template #sidebar>
        <div class="space-y-2">
          <!-- Deck List Header -->
          <div class="flex items-center justify-between">
            <h2 class="pl-0.5 text-xl font-bold">Decks ({{ deckStore.userDecks.length }})</h2>
            <button 
              @click="openCreateDeckModal"
              class="w-10 h-10 button-visible"
            >
              <Plus :size="18" />
            </button>
          </div>

          <!-- Deck List -->
          <div class="space-y-2">
            <div v-for="deck in deckStore.userDecks" :key="deck.id" class="px-4 py-3 group"
              :class="selectedDeck === deck.id ? 'panel-active' : 'panel-clickable'" @click="selectDeck(deck.id)">
              <div class="text-sm">{{ deck.title }}</div>
              <!-- Divider -->
              <div class="w-full h-px my-3 transition-all duration-75" :class="[
                selectedDeck === deck.id ? 'bg-neutral-700' : 'bg-neutral-800 group-hover:bg-neutral-700'
              ]"></div>
              <div class="flex justify-between px-8 text-sm">
                <span class="text-cyan-400">{{ 10 }}</span>
                <span class="text-green-400">{{ 25 }}</span>
                <span class="text-orange-400">{{ 60 }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="selectedDeck" class="space-y-4">
          <!-- Deck Header -->
          <div class="flex items-center justify-between w-full p-2 panel h-14">
            <button class="w-24 button-accept-visible">
              Study
            </button>
            <h1 class="relative flex items-center gap-1.5 text-xl font-bold group">
              {{ deckStore.getDeckById(selectedDeck)?.title }}
              <Info v-if="deckStore.getDeckById(selectedDeck)?.description" 
                    :size="16" 
                    class="text-neutral-500" />
              <div v-if="deckStore.getDeckById(selectedDeck)?.description" 
                   class="absolute invisible p-2 text-sm transition-all -translate-x-1/2 translate-y-2 rounded-md opacity-0 left-1/2 top-full bg-neutral-800 group-hover:visible group-hover:opacity-100 min-w-[200px] max-w-[300px] text-neutral-400">
                {{ deckStore.getDeckById(selectedDeck)?.description }}
              </div>
            </h1>
            <div class="flex space-x-2">
              <button class="w-10 h-10 button-lighter-visible">
                <Pencil :size="18" />
              </button>
              <button
                @click="handleDeleteDeck"
                class="w-10 h-10 button-cancel-visible"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
          <!-- Deck Stats -->
          <div class="p-4 space-y-2 panel">
            <div class="flex justify-between">
              <span class="text-neutral-400">New:</span>
              <span>10</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Learning:</span>
              <span>25</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Graduated:</span>
              <span>60</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-400">Total:</span>
              <span>243</span>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="space-y-4">
            <!-- Add Comment -->
            <div class="p-3 space-y-2 panel">
              <textarea
                v-model="newComment"
                placeholder="Add a comment..."
                class="w-full h-20 resize-none input-lighter-filled"
                rows="3"
              />
              <div class="flex justify-end">
                <button 
                  @click="addComment"
                  :disabled="!newComment"
                  class="w-24 button-lighter-visible"
                >
                  Comment
                </button>
              </div>
            </div>

            <!-- Comments List -->
            <div v-if="selectedDeck" class="space-y-3">
              <div
                v-for="comment in usersStore.getThreadedComments(selectedDeck)"
                :key="comment.id"
                class="pb-3 space-y-2 panel"
              >
                <!-- Comment Header - Always visible -->
                <div class="flex items-start justify-between px-3 pt-3 pb-1">
                  <div class="flex items-center gap-3">
                    <router-link 
                      :to="`/user/${comment.user_id}`"
                      class="transition-opacity hover:opacity-80"
                    >
                      <img 
                        :src="usersStore.getUserProfile(comment.user_id)?.avatar_url || '/default-avatar.png'"
                        :alt="usersStore.getUserProfile(comment.user_id)?.username"
                        class="w-8 h-8 rounded-full bg-neutral-700"
                      />
                    </router-link>
                    <div class="flex flex-col">
                      <router-link 
                        :to="`/user/${comment.user_id}`"
                        class="text-sm font-medium transition-colors hover:text-neutral-300"
                      >
                        {{ usersStore.getUserProfile(comment.user_id)?.username || 'Anonymous' }}
                      </router-link>
                      <span class="text-xs text-neutral-400">
                        {{ new Date(comment.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) }}
                        at
                        {{ new Date(comment.created_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) }}
                        {{ comment.edited_at ? '(edited)' : '' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-start gap-1">
                    <button
                      v-if="comment.user_id === usersStore.getCurrentUserProfile?.id"
                      @click="startEditComment(comment)"
                      class="p-1 text-neutral-400 hover:text-neutral-300"
                    >
                      <Pencil :size="17" />
                    </button>
                    <button
                      v-if="comment.user_id === usersStore.getCurrentUserProfile?.id"
                      @click="usersStore.deleteComment(comment.id, selectedDeck)"
                      class="p-1 text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 :size="17" />
                    </button>
                    <button 
                      @click="replyingTo = comment.id"
                      class="p-1 text-neutral-400 hover:text-neutral-300"
                    >
                      <MessageSquare :size="17" />
                    </button>
                    <button
                      @click="toggleCommentLike(comment.id)"
                      class="flex items-center gap-1.5 p-1"
                      :class="{
                        'text-red-400': usersStore.hasLikedComment(comment.id),
                        'text-neutral-400 hover:text-red-400': !usersStore.hasLikedComment(comment.id)
                      }"
                    >
                      <Heart :size="17" />
                      <span class="text-sm leading-none">{{ usersStore.commentLikes.get(comment.id)?.size || 0 }}</span>
                    </button>
                  </div>
                </div>

                <!-- Comment Content -->
                <div class="px-3 pb-2">
                  <div v-if="editingComment === comment.id">
                    <textarea
                      v-model="editCommentContent"
                      class="w-full h-20 resize-none input-lighter-filled"
                      rows="3"
                    />
                    <div class="flex justify-end gap-2 mt-2">
                      <button
                        @click="editingComment = null"
                        class="w-24 button-lighter-visible"
                      >
                        Cancel
                      </button>
                      <button
                        @click="updateComment"
                        class="w-24 button-lighter-visible"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div v-else class="flex-1 pl-1 break-words whitespace-pre-wrap">
                    {{ comment.content }}
                  </div>
                </div>
                
                <!-- Replies -->
                <div v-if="replyingTo === comment.id" class="px-3 pb-1 mt-2">
                  <textarea
                    v-model="replyContent"
                    placeholder="Write a reply..."
                    class="w-full h-20 resize-none input-lighter-filled"
                    rows="3"
                  />
                  <div class="flex justify-end gap-2 mt-2">
                    <button
                      @click="replyingTo = null"
                      class="w-24 button-lighter-visible"
                    >
                      Cancel
                    </button>
                    <button
                      @click="addReply"
                      :disabled="!replyContent"
                      class="w-24 button-lighter-visible"
                    >
                      Reply
                    </button>
                  </div>
                </div>
                <div class="mx-3 my-3 space-y-2">
                  <div
                    v-for="reply in usersStore.getCommentReplies(comment.id, selectedDeck)"
                    :key="reply.id"
                    class="p-3 rounded-lg bg-neutral-800"
                  >
                    <!-- Reply Header -->
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <router-link 
                          :to="`/user/${reply.user_id}`"
                          class="transition-opacity hover:opacity-80"
                        >
                          <img 
                            :src="usersStore.getUserProfile(reply.user_id)?.avatar_url || '/default-avatar.png'"
                            :alt="usersStore.getUserProfile(reply.user_id)?.username"
                            class="w-6 h-6 rounded-full bg-neutral-700"
                          />
                        </router-link>
                        <router-link 
                          :to="`/user/${reply.user_id}`"
                          class="text-xs font-medium transition-colors hover:text-neutral-300"
                        >
                          {{ usersStore.getUserProfile(reply.user_id)?.username || 'Anonymous' }}
                        </router-link>
                        <span class="text-xs text-neutral-400">
                          {{ new Date(reply.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) }}
                          at
                          {{ new Date(reply.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) }}
                          {{ reply.edited_at ? '(edited)' : '' }}
                        </span>
                      </div>
                      <!-- Add reply actions -->
                      <div class="flex items-center gap-1" v-if="reply.user_id === usersStore.getCurrentUserProfile?.id">
                        <button
                          @click="startEditComment(reply)"
                          class="p-1 text-neutral-400 hover:text-neutral-300"
                        >
                          <Pencil :size="14" />
                        </button>
                        <button
                          @click="usersStore.deleteComment(reply.id, selectedDeck)"
                          class="p-1 text-neutral-400 hover:text-red-400"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </div>
                    </div>
                    
                    <!-- Reply Content -->
                    <div v-if="editingComment === reply.id">
                      <textarea
                        v-model="editCommentContent"
                        class="w-full h-20 resize-none input-lighter-filled"
                        rows="3"
                      />
                      <div class="flex justify-end gap-2 mt-2">
                        <button
                          @click="editingComment = null"
                          class="w-24 button-lighter-visible"
                        >
                          Cancel
                        </button>
                        <button
                          @click="updateComment"
                          class="w-24 button-lighter-visible"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    <div v-else class="pl-1 break-words whitespace-pre-wrap">
                      {{ reply.content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center mt-16 text-neutral-500">
          Select a deck to view details
        </div>
      </template>
    </PageLayout>
  </div>
  <CreateDeckModal ref="createDeckModalRef" />
</template>