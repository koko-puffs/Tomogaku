<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { Copy, ChevronLeft, ChevronRight, RotateCcw, Save, Trash2, X, MoreHorizontal, Eye, History } from 'lucide-vue-next';
import { QuillEditor } from '@vueup/vue-quill';
import '../../../styles/quill.css';
import { Card } from '../../../types/deck.types.ts';
import { useAuthStore } from '../../../stores/authStore';
import StudyCard from '../study/StudyCard.vue';

const props = defineProps<{
  card: Card;
}>();

const emit = defineEmits<{
  'update': [updates: { front_content: string; back_content: string; tags: string[]; position: number | null }];
  'delete': [];
  'delete-with-modal': [];
  'duplicate': [];
  'previous': [];
  'next': [];
  'forget': [];
}>();

const editFrontContent = ref(props.card.front_content);
const editBackContent = ref(props.card.back_content);
const editTags = ref<string[]>([...(props.card.tags || [])]);
const newTag = ref('');
const tagError = ref('');
const editPosition = ref<number | null>(props.card.position);
const isShiftPressed = ref(false);
const showDebug = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const showPreviewModal = ref(false);
const previewCard = ref<Card | null>(null);

const authStore = useAuthStore();
const userProfile = computed(() => authStore.userProfile);

// Update watch to properly reset all fields
watch(() => props.card.id, () => {
  // Clear all fields first
  editFrontContent.value = '';
  editBackContent.value = '';
  editTags.value = [];
  editPosition.value = null;
  newTag.value = '';
  tagError.value = '';

  // Then set new values on next tick
  nextTick(() => {
    editFrontContent.value = props.card.front_content || '';
    editBackContent.value = props.card.back_content || '';
    editTags.value = [...(props.card.tags || [])];
    editPosition.value = props.card.position;
  });
}, { immediate: true });

// Add this helper function
const cleanContent = (content: string) => {
  return content.replace(/<span class="ql-cursor">.*?<\/span>/g, '');
};

const hasChanges = computed(() => {
  return cleanContent(editFrontContent.value) !== cleanContent(props.card.front_content) ||
    cleanContent(editBackContent.value) !== cleanContent(props.card.back_content) ||
    !areArraysEqual(editTags.value, props.card.tags || []) ||
    editPosition.value !== props.card.position;
});

const areArraysEqual = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => item === arr2[index]);
};

const handleUpdate = () => {
  const trimmedFront = editFrontContent.value.trim();
  // Check if the content is empty or only contains HTML whitespace/tags
  const isEmpty = !trimmedFront || trimmedFront === '<p></p>' || trimmedFront === '<p><br></p>';

  if (isEmpty || !hasChanges.value) return;

  emit('update', {
    front_content: editFrontContent.value,
    back_content: editBackContent.value,
    tags: editTags.value,
    position: editPosition.value,
  });
};

const addTag = () => {
  const tag = newTag.value.trim().toLowerCase();

  if (!tag) return;
  if (tag.includes(' ')) {
    tagError.value = 'Tags should be single words';
    return;
  }
  if (editTags.value.includes(tag)) {
    tagError.value = 'Tag already exists';
    return;
  }
  if (editTags.value.length >= 10) {
    tagError.value = 'Maximum 10 tags allowed';
    return;
  }
  if (tag.length > 20) {
    tagError.value = 'Tag is too long (max 20 characters)';
    return;
  }

  editTags.value.push(tag);
  newTag.value = '';
  tagError.value = '';
};

const removeTag = (tagToRemove: string) => {
  editTags.value = editTags.value.filter(tag => tag !== tagToRemove);
};

const resetForm = () => {
  editFrontContent.value = props.card.front_content || '';
  editBackContent.value = props.card.back_content || '';
  editTags.value = [...(props.card.tags || [])];
  editPosition.value = props.card.position;
  newTag.value = '';
  tagError.value = '';
};

const handlePrevious = () => {
  emit('previous');
};

const handleNext = () => {
  emit('next');
};

const handleDelete = (event: MouseEvent) => {
  if (event.shiftKey) {
    // If shift is pressed, delete immediately
    emit('delete');
  } else {
    // Otherwise, emit the normal delete event which will show the modal
    emit('delete-with-modal');
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  // Only handle keyboard events if not typing in an input or editor
  if (event.target instanceof HTMLElement &&
    (event.target.tagName === 'INPUT' ||
      event.target.className.includes('ql-editor'))) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    handlePrevious();
  } else if (event.key === 'ArrowRight') {
    handleNext();
  }
};

// Add event listeners for shift key
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keydown', handleShiftDown);
  window.addEventListener('keyup', handleShiftUp);
  document.addEventListener('click', handleClickOutside);
});

const handleShiftDown = (e: KeyboardEvent) => {
  if (e.key === 'Shift') isShiftPressed.value = true;
};

const handleShiftUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift') isShiftPressed.value = false;
};

// Update unmount to remove all listeners
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keydown', handleShiftDown);
  window.removeEventListener('keyup', handleShiftUp);
  document.removeEventListener('click', handleClickOutside);
});

const handlePositionInput = (event: Event) => {
  event.stopPropagation();
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // Allow empty value (null position)
  if (!value) {
    editPosition.value = null;
    return;
  }

  // Convert to number and validate
  const num = parseInt(value);
  if (!isNaN(num) && num > 0) {
    editPosition.value = num;
  } else {
    // Reset to previous valid value
    input.value = editPosition.value?.toString() ?? '';
  }
};

const formatDate = (date: string | null) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleString();
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

const handlePreview = () => {
  previewCard.value = {
    ...props.card,
    front_content: editFrontContent.value,
    back_content: editBackContent.value,
    tags: editTags.value,
    position: editPosition.value
  };

  showPreviewModal.value = true;
  closeDropdown();
};

const handleForget = () => {
  emit('forget');
  closeDropdown();
};
</script>

<template>
  <div
    class="panel motion-translate-x-in-[0%] motion-translate-y-in-[-0.6%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
    <!-- Action Buttons -->
    <div class="flex items-center justify-between py-4 pl-3 pr-4">
      <div class="flex">
        <button @click="handlePrevious" class="flex items-center w-10 gap-1 button-lighter" title="Previous card">
          <ChevronLeft :size="22" />
        </button>
        <button @click="handleNext" class="flex items-center w-10 gap-1 button-lighter" title="Next card">
          <ChevronRight :size="22" />
        </button>
      </div>

      <div class="flex gap-2">
        <!-- Dropdown for small screens -->
        <div class="relative lg:hidden" ref="dropdownRef">
          <button @click.stop="toggleDropdown" class="flex items-center w-10 gap-1 button-lighter" title="More options">
            <MoreHorizontal :size="18" />
          </button>

          <!-- Dropdown menu -->
          <div v-if="isDropdownOpen"
            class="absolute right-0 w-48 py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-x-in-[0%] motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity z-[5]">
            <button @click="handlePreview"
              class="flex items-center w-full gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <Eye :size="18" />
              <span>Preview card</span>
            </button>
            <button @click="emit('duplicate')"
              class="flex items-center w-full gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <Copy :size="18" />
              <span>Duplicate card</span>
            </button>
            <button @click="handleForget"
              class="flex items-center w-full gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
              <History :size="18" />
              <span>Forget card</span>
            </button>
            <button @click="handleDelete"
              class="flex items-center w-full gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800"
              :class="{ 'text-red-400': isShiftPressed }">
              <Trash2 :size="18" />
              <span>Delete card</span>
            </button>
          </div>
        </div>

        <!-- All buttons for large screens -->
        <div class="hidden lg:flex">
          <button @click="handlePreview" class="flex items-center w-10 gap-1 button-lighter" title="Preview card">
            <Eye :size="18" />
          </button>
          <button @click="emit('duplicate')" class="flex items-center w-10 gap-1 button-lighter" title="Duplicate card">
            <Copy :size="18" />
          </button>
          <button @click="handleForget" class="flex items-center w-10 gap-1 button-lighter" title="Forget card">
            <History :size="18" />
          </button>
          <button @click="handleDelete" :class="[
            'flex items-center w-10 gap-1',
            isShiftPressed ? 'button-cancel-visible' : 'button-lighter'
          ]" title="Delete card (Hold Shift to delete without confirmation)">
            <Trash2 :size="18" />
          </button>
        </div>

        <button @click="resetForm" :disabled="!hasChanges" :class="[
          'button-lighter-visible flex items-center gap-2 w-24',
          { 'text-neutral-600 pointer-events-none': !hasChanges }
        ]">
          <RotateCcw :size="18" />
          <span>Reset</span>
        </button>
        <button @click="handleUpdate"
          :disabled="!editFrontContent.trim() || editFrontContent.trim() === '<p></p>' || editFrontContent.trim() === '<p><br></p>' || !hasChanges"
          :class="[
            editFrontContent.trim() && editFrontContent.trim() !== '<p></p>' && editFrontContent.trim() !== '<p><br></p>' && hasChanges
              ? 'button-accept-visible flex items-center gap-2 w-24'
              : 'button-lighter-visible flex items-center gap-2 w-24',
            { 'text-neutral-600 pointer-events-none': !editFrontContent.trim() || editFrontContent.trim() === '<p></p>' || editFrontContent.trim() === '<p><br></p>' || !hasChanges }
          ]">
          <Save :size="18" />
          <span>Save</span>
        </button>
      </div>
    </div>

    <!-- Full-width divider -->
    <div class="h-px bg-neutral-800"></div>

    <!-- Content Area -->
    <div class="p-4 space-y-6">
      <!-- Front Content -->
      <div class="space-y-2">
        <label class="block text-sm text-neutral-400">Front</label>
        <QuillEditor :key="`front-${props.card.id}`" v-model:content="editFrontContent" contentType="html"
          toolbar="essential" theme="snow" />
      </div>

      <!-- Back Content -->
      <div class="space-y-2">
        <label class="block text-sm text-neutral-400">Back</label>
        <QuillEditor :key="`back-${props.card.id}`" v-model:content="editBackContent" contentType="html"
          toolbar="essential" theme="snow" />
      </div>

      <div class="h-px bg-neutral-800"></div>

      <!-- Tags and Position Section -->
      <div class="flex gap-2">
        <!-- Tags Section -->
        <div class="flex-1 space-y-2">
          <label class="block text-sm text-neutral-400">Tags</label>
          <div class="relative">
            <input v-model="newTag" @keydown.enter.prevent="addTag" type="text" class="w-full input-lighter-filled"
              placeholder="Type a tag and press Enter" />
            <p v-if="tagError" class="absolute mt-1 text-sm text-red-500">{{ tagError }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in editTags" :key="tag"
              class="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-neutral-800">
              {{ tag }}
              <button @click="removeTag(tag)" class="pl-1 rounded-full hover:text-red-400">
                <X :size="14" />
              </button>
            </span>
          </div>
        </div>

        <!-- Position Section -->
        <div class="w-24 space-y-2">
          <label class="block text-sm text-neutral-400">Position</label>
          <input type="number" :value="editPosition" @input="handlePositionInput" @keydown.stop
            class="w-full input-lighter-filled" min="1" placeholder="#" />
        </div>
      </div>
    </div>

    <!-- Debug Panel -->
    <div v-if="userProfile?.account_type === 'admin'" class="mt-4">
      <button @click="showDebug = !showDebug"
        class="w-full px-4 py-2 text-sm text-left rounded-md text-neutral-400 hover:bg-neutral-800">
        Debug Info {{ showDebug ? '▼' : '▶' }}
      </button>

      <div v-if="showDebug" class="p-4 mt-2 space-y-4 text-sm border rounded-md border-neutral-700">
        <div class="grid grid-cols-2 gap-4">
          <!-- Status Info -->
          <div>
            <h4 class="mb-2 font-medium text-neutral-300">Status</h4>
            <div class="space-y-1 text-neutral-400">
              <p>State: <span class="text-neutral-300">{{ card.state }}</span></p>
              <p>Due Date: <span class="text-neutral-300">{{ formatDate(card.due) }}</span></p>
            </div>
          </div>

          <!-- Review Info -->
          <div>
            <h4 class="mb-2 font-medium text-neutral-300">Review History</h4>
            <div class="space-y-1 text-neutral-400">
              <p>Total Reviews: <span class="text-neutral-300">{{ card.reps }}</span></p>
              <p>Lapses: <span class="text-neutral-300">{{ card.lapses }}</span></p>
            </div>
          </div>

          <!-- FSRS Parameters -->
          <div>
            <h4 class="mb-2 font-medium text-neutral-300">FSRS Parameters</h4>
            <div class="space-y-1 text-neutral-400">
              <p>Stability: <span class="text-neutral-300">{{ card.stability?.toFixed(2) }}</span></p>
              <p>Difficulty: <span class="text-neutral-300">{{ card.difficulty?.toFixed(2) }}</span></p>
              <p>Elapsed Days: <span class="text-neutral-300">{{ card.elapsed_days?.toFixed(2) }}</span></p>
              <p>Scheduled Days: <span class="text-neutral-300">{{ card.scheduled_days?.toFixed(2) }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Modal -->
  <Teleport to="body">
    <div v-if="showPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click="showPreviewModal = false">
      <div class="w-full max-w-3xl" @click.stop>
        <div class="relative">
          <!-- Close button -->
          <button @click="showPreviewModal = false"
            class="absolute z-10 p-2 rounded-lg right-4 top-4 hover:bg-neutral-800">
            <X :size="20" />
          </button>

          <!-- Study Card -->
          <StudyCard :card="showPreviewModal && previewCard ? previewCard : card" :preview="true" />
        </div>
      </div>
    </div>
  </Teleport>
</template>