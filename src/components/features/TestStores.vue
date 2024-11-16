<!-- TestStores.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/authStore'
import { useDeckStore } from '../../stores/deckStore'
import { useUsersStore } from '../../stores/usersStore'

// Initialize stores
const authStore = useAuthStore()
const deckStore = useDeckStore()
const usersStore = useUsersStore()

// Get reactive refs from stores
const { user } = storeToRefs(authStore)
// @ts-ignore - Ignoring deep type instantiation error
// TODO: Fix this
const { decks, currentDeck, loading: deckLoading } = storeToRefs(deckStore)

// Local state
const newDeckTitle = ref('')
const newDeckDescription = ref('')
const newCardFront = ref('')
const newCardBack = ref('')
const newComment = ref('')
const editingComment = ref<string | null>(null)
const editCommentContent = ref('')

// Initialize data
onMounted(async () => {
  if (user.value) {
    await Promise.all([
      deckStore.fetchDecks(),
      usersStore.fetchUserProfile(user.value.id),
      usersStore.fetchFollowing()
    ])
  }
})

// Deck handlers
const createDeck = async () => {
  if (!newDeckTitle.value) return
  
  try {
    await deckStore.createDeck({
      title: newDeckTitle.value,
      description: newDeckDescription.value,
      visibility: 'public'
    })
    newDeckTitle.value = ''
    newDeckDescription.value = ''
  } catch (error) {
    console.error('Failed to create deck:', error)
  }
}

const selectDeck = async (deckId: string) => {
  const deck = deckStore.getDeckById(deckId)
  if (deck) {
    deckStore.currentDeck = deck
    await Promise.all([
      deckStore.fetchCards(deckId),
      usersStore.fetchDeckComments(deckId)
    ])
  }
}

// Card handlers
const createCard = async () => {
  if (!currentDeck.value || !newCardFront.value || !newCardBack.value) return
  
  try {
    await deckStore.createCard({
      deck_id: currentDeck.value.id,
      front_content: newCardFront.value,
      back_content: newCardBack.value
    })
    newCardFront.value = ''
    newCardBack.value = ''
  } catch (error) {
    console.error('Failed to create card:', error)
  }
}

// Comment handlers
const addComment = async () => {
  if (!currentDeck.value || !newComment.value) return
  
  try {
    await usersStore.createComment(currentDeck.value.id, newComment.value)
    newComment.value = ''
  } catch (error) {
    console.error('Failed to create comment:', error)
  }
}

const startEditComment = (comment: any) => {
  editingComment.value = comment.id
  editCommentContent.value = comment.content
}

const updateComment = async () => {
  if (!editingComment.value || !editCommentContent.value) return
  
  try {
    await usersStore.updateComment(editingComment.value, editCommentContent.value)
    editingComment.value = null
    editCommentContent.value = ''
  } catch (error) {
    console.error('Failed to update comment:', error)
  }
}

const toggleCommentLike = async (commentId: string) => {
  try {
    await usersStore.toggleCommentLike(commentId)
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

// Profile handlers
const profile = ref(usersStore.getCurrentUserProfile)

const updateProfile = async () => {
  if (!profile.value) return
  
  try {
    await usersStore.updateUserProfile(profile.value)
  } catch (error) {
    console.error('Failed to update profile:', error)
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <template v-if="user">
      <!-- Create Deck Section -->
      <section class="p-4 mb-8 bg-gray-800 rounded-lg shadow">
        <h2 class="mb-4 text-2xl font-bold text-gray-100">Create New Deck</h2>
        <div class="space-y-4">
          <input
            v-model="newDeckTitle"
            placeholder="Deck Title"
            class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
          >
          <textarea
            v-model="newDeckDescription"
            placeholder="Deck Description"
            class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
          />
          <button
            @click="createDeck"
            class="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
            :disabled="!newDeckTitle"
          >
            Create Deck
          </button>
        </div>
      </section>

      <!-- Decks List Section -->
      <section class="p-4 mb-8 bg-gray-800 rounded-lg shadow">
        <h2 class="mb-4 text-2xl font-bold text-gray-100">Your Decks</h2>
        <div v-if="deckLoading" class="text-center text-gray-300">Loading decks...</div>
        <div v-else class="space-y-2">
          <div
            v-for="deck in deckStore.userDecks"
            :key="deck.id"
            class="p-2 text-gray-100 border border-gray-600 rounded cursor-pointer hover:bg-gray-700"
            @click="selectDeck(deck.id)"
          >
            <h3 class="font-bold">{{ deck.title }}</h3>
            <p class="text-sm text-gray-400">{{ deck.description }}</p>
          </div>
        </div>
      </section>

      <!-- Current Deck Section -->
      <section v-if="currentDeck" class="p-4 mb-8 text-gray-100 bg-gray-800 rounded-lg shadow">
        <h2 class="mb-4 text-2xl font-bold">
          Current Deck: {{ currentDeck.title }}
        </h2>

        <!-- Add Card Form -->
        <div class="mb-4 space-y-2">
          <h3 class="font-bold">Add New Card</h3>
          <input
            v-model="newCardFront"
            placeholder="Front Content"
            class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
          >
          <input
            v-model="newCardBack"
            placeholder="Back Content"
            class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
          >
          <button
            @click="createCard"
            class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            :disabled="!newCardFront || !newCardBack"
          >
            Add Card
          </button>
        </div>

        <!-- Cards List -->
        <div class="mb-4">
          <h3 class="mb-2 font-bold">Cards</h3>
          <div class="space-y-2">
            <div
              v-for="card in deckStore.currentDeckCards"
              :key="card.id"
              class="p-2 bg-gray-700 border border-gray-600 rounded"
            >
              <div class="font-medium">Front: {{ card.front_content }}</div>
              <div class="text-gray-300">Back: {{ card.back_content }}</div>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="mt-4">
          <h3 class="mb-2 font-bold">Comments</h3>
          <!-- Add Comment -->
          <div class="mb-4">
            <textarea
              v-model="newComment"
              placeholder="Add a comment..."
              class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
            />
            <button
              @click="addComment"
              class="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              :disabled="!newComment"
            >
              Add Comment
            </button>
          </div>

          <!-- Comments List -->
          <div class="space-y-4">
            <div
              v-for="comment in usersStore.getThreadedComments(currentDeck.id)"
              :key="comment.id"
              class="p-2 bg-gray-700 border border-gray-600 rounded"
            >
              <div v-if="editingComment === comment.id">
                <textarea
                  v-model="editCommentContent"
                  class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
                />
                <div class="mt-2 space-x-2">
                  <button
                    @click="updateComment"
                    class="px-3 py-1 text-sm text-white bg-green-500 rounded"
                  >
                    Save
                  </button>
                  <button
                    @click="editingComment = null"
                    class="px-3 py-1 text-sm text-white bg-gray-500 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div v-else>
                <div class="flex justify-between">
                  <div>{{ comment.content }}</div>
                  <div class="space-x-2">
                    <button
                      v-if="comment.user_id === user.id"
                      @click="startEditComment(comment)"
                      class="text-blue-500 hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      v-if="comment.user_id === user.id"
                      @click="usersStore.deleteComment(comment.id, currentDeck.id)"
                      class="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                    <button
                      @click="toggleCommentLike(comment.id)"
                      :class="{
                        'text-red-500': usersStore.hasLikedComment(comment.id),
                        'text-gray-500': !usersStore.hasLikedComment(comment.id)
                      }"
                    >
                      ♥ {{ usersStore.commentLikes.get(comment.id)?.size || 0 }}
                    </button>
                  </div>
                </div>
                <!-- Nested Replies -->
                <div class="mt-2 ml-4 space-y-2">
                  <div
                    v-for="reply in usersStore.getCommentReplies(comment.id, currentDeck.id)"
                    :key="reply.id"
                    class="p-2 bg-gray-600 rounded"
                  >
                    {{ reply.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- User Profile Section -->
      <section v-if="profile" class="p-4 text-gray-100 bg-gray-800 rounded-lg shadow">
        <h2 class="mb-4 text-2xl font-bold">Your Profile</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              v-model="profile.bio"
              class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Location</label>
            <input
              v-model="profile.location"
              class="w-full p-2 text-gray-100 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded"
            >
          </div>
          <button
            @click="updateProfile"
            class="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
          >
            Update Profile
          </button>
        </div>

        <!-- Profile Stats -->
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div class="p-2 bg-gray-700 rounded">
            <div class="text-sm text-gray-400">Decks Created</div>
            <div class="text-xl font-bold">{{ profile.decks_created_count }}</div>
          </div>
          <div class="p-2 bg-gray-700 rounded">
            <div class="text-sm text-gray-400">Cards Studied</div>
            <div class="text-xl font-bold">{{ profile.total_cards_studied }}</div>
          </div>
          <div class="p-2 bg-gray-700 rounded">
            <div class="text-sm text-gray-400">Study Streak</div>
            <div class="text-xl font-bold">{{ profile.streak_days }} days</div>
          </div>
          <div class="p-2 bg-gray-700 rounded">
            <div class="text-sm text-gray-400">Following</div>
            <div class="text-xl font-bold">{{ profile.following_count }}</div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>