<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="relative w-[500px] bg-neutral-900 rounded-lg shadow-xl border border-neutral-800 motion-translate-y-in-[3%] motion-opacity-in-[0%] motion-duration-[0.2s]">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
        <h2 class="text-xl font-semibold">Create New Deck</h2>
        <button @click="closeModal" class="p-2 transition-colors rounded-lg hover:bg-neutral-800">
          <X :size="20" />
        </button>
      </div>

      <!-- Content area -->
      <div class="p-6">
        <div class="space-y-4">
          <div class="space-y-2">
            <label for="deckTitle" class="block text-sm">Title</label>
            <div class="relative">
              <input
                id="deckTitle"
                v-model="title"
                type="text"
                class="w-full input-lighter-filled"
                :class="{ 'border-red-500': error }"
                placeholder="Enter deck title"
                :disabled="loading"
              />
              <span v-if="error" class="absolute text-sm text-red-500 -bottom-6">
                {{ error }}
              </span>
            </div>
          </div>
          
          <div class="space-y-2">
            <label for="deckDescription" class="block text-sm">Description (optional)</label>
            <textarea
              id="deckDescription"
              v-model="description"
              rows="3"
              class="w-full h-24 resize-none input-lighter-filled"
              placeholder="Enter deck description"
              :disabled="loading"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 px-5 py-3 border-t border-neutral-800">
        <button 
          @click="closeModal" 
          class="w-24 button-lighter-visible"
          :disabled="loading"
        >
          Cancel
        </button>
        <button 
          @click="handleCreate" 
          :disabled="!title || loading"
          class="w-24 button-accept-visible"
        >
          <LoadingSpinner v-if="loading" class="w-5 h-5" />
          <span v-else>Create</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { useDeckStore } from '../../../stores/deckStore';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

const deckStore = useDeckStore();
const isOpen = ref(false);
const title = ref('');
const description = ref('');
const loading = ref(false);
const error = ref('');

const openModal = () => {
  isOpen.value = true;
  title.value = '';
  description.value = '';
  error.value = '';
};

const closeModal = () => {
  if (loading.value) return;
  isOpen.value = false;
  title.value = '';
  description.value = '';
  error.value = '';
};

const handleCreate = async () => {
  if (!title.value || loading.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await deckStore.createDeck({
      title: title.value,
      description: description.value || null,
      visibility: 'private' as const,
    });
    closeModal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create deck';
  } finally {
    loading.value = false;
    closeModal();
  }
};

defineExpose({ openModal, closeModal });
</script>