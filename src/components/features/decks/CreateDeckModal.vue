<template>
  <Modal v-if="isOpen" @close="closeModal">
    <template #title>
      Create a new deck
    </template>

    <template #content>
      <div class="space-y-4">
        <div class="space-y-2">
          <label for="deckTitle" class="block text-sm text-neutral-400">Title</label>
          <div class="relative">
            <input id="deckTitle" v-model="title" type="text" class="w-full input-lighter-filled"
              :class="{ 'border-red-500': error }" placeholder="Enter deck title" :disabled="loading" />
            <span v-if="error" class="absolute text-sm text-red-500 -bottom-6">
              {{ error }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <label for="deckDescription" class="block text-sm text-neutral-400">Description (optional)</label>
          <textarea id="deckDescription" v-model="description" rows="3"
            class="w-full h-48 resize-none input-lighter-filled !-mb-2" placeholder="Enter deck description"
            :disabled="loading" />
        </div>

        <div class="space-y-2">
          <label for="deckTags" class="block text-sm text-neutral-400">Tags (optional)</label>
          <div class="relative space-y-2">
            <input v-model="newTag" @keydown.enter.prevent="addTag" type="text" class="w-full input-lighter-filled"
              placeholder="Type a tag and press Enter" :disabled="loading" />
            <p v-if="tagError" class="text-sm text-red-500">
              {{ tagError }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 mb-2">
            <span v-for="tag in tags" :key="tag"
              class="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-neutral-800">
              {{ tag }}
              <button @click="removeTag(tag)" class="pl-1 rounded-full hover:text-red-400">
                <X :size="14" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button @click="closeModal" class="w-24 button-lighter" :disabled="loading">
        Cancel
      </button>
      <button @click="handleCreate" :disabled="!title.trim() || loading" :class="[
        title.trim() ? 'button-accept-visible' : 'button-lighter-visible',
        { 'text-neutral-600 pointer-events-none': !title.trim() }
      ]" class="w-24">
        <LoadingSpinner v-if="loading" class="w-5 h-5" />
        <span v-else>Create</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { useDeckStore } from '../../../stores/deckStore';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import Modal from '../../common/Modal.vue';

const deckStore = useDeckStore();
const isOpen = ref(false);
const title = ref('');
const description = ref('');
const loading = ref(false);
const error = ref('');

// New refs for tags
const tags = ref<string[]>([]);
const newTag = ref('');
const tagError = ref('');

const addTag = () => {
  const tag = newTag.value.trim().toLowerCase();

  // Validation
  if (!tag) return;
  if (tag.includes(' ')) {
    tagError.value = 'Tags should be single words';
    return;
  }
  if (tags.value.includes(tag)) {
    tagError.value = 'Tag already exists';
    return;
  }
  if (tags.value.length >= 10) {
    tagError.value = 'Maximum 10 tags allowed';
    return;
  }
  if (tag.length > 20) {
    tagError.value = 'Tag is too long (max 20 characters)';
    return;
  }

  // Add tag
  tags.value.push(tag);
  newTag.value = '';
  tagError.value = '';
};

const removeTag = (tagToRemove: string) => {
  tags.value = tags.value.filter(tag => tag !== tagToRemove);
};

const openModal = () => {
  isOpen.value = true;
  title.value = '';
  description.value = '';
  error.value = '';
  tags.value = [];
  newTag.value = '';
  tagError.value = '';
};

const closeModal = () => {
  if (loading.value) return;
  isOpen.value = false;
  title.value = '';
  description.value = '';
  error.value = '';
  tags.value = [];
  newTag.value = '';
  tagError.value = '';
};

const handleCreate = async () => {
  if (!title.value.trim() || loading.value) return;

  loading.value = true;
  error.value = '';

  try {
    const newDeck = await deckStore.createDeck({
      title: title.value.trim(),
      description: description.value || null,
      visibility: 'private' as const,
      tags: tags.value.length > 0 ? tags.value : null,
    });
    closeModal();
    emit('created', newDeck.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create deck';
  } finally {
    loading.value = false;
    closeModal();
  }
};

const emit = defineEmits<{
  (event: 'created', deckId: string): void;
}>();

defineExpose({ openModal, closeModal });
</script>