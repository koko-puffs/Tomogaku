<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { Copy, ChevronLeft, ChevronRight, RotateCcw, Save, Trash2, X } from 'lucide-vue-next';
import { QuillEditor } from '@vueup/vue-quill';
import '../../../styles/quill.css';

const props = defineProps<{
  card: {
    id: string;
    front_content: string;
    back_content: string;
    tags: string[] | null;
    position: number | null;
  };
}>();

const emit = defineEmits<{
  'update': [updates: { front_content: string; back_content: string; tags: string[]; position: number | null }];
  'delete': [];
  'duplicate': [];
  'previous': [];
  'next': [];
}>();

const editFrontContent = ref(props.card.front_content);
const editBackContent = ref(props.card.back_content);
const editTags = ref<string[]>([...(props.card.tags || [])]);
const newTag = ref('');
const tagError = ref('');
const editPosition = ref<number | null>(props.card.position);

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

const hasChanges = computed(() => {
  return editFrontContent.value !== props.card.front_content ||
         editBackContent.value !== props.card.back_content ||
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
</script>

<template>
  <div class="panel motion-translate-x-in-[0%] motion-translate-y-in-[-1%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
    <!-- Move the Action Buttons to the top -->
    <div class="flex items-center justify-between p-4">
      <div class="flex gap-2">
        <button @click="handlePrevious" 
          class="flex items-center w-10 gap-1 button-lighter-visible" 
          title="Previous card">
          <ChevronLeft :size="18" />
        </button>
        <button @click="handleNext" 
          class="flex items-center w-10 gap-1 mr-2 button-lighter-visible" 
          title="Next card">
          <ChevronRight :size="18" />
        </button>
      </div>

      <div class="flex gap-2">
        <button @click="emit('delete')" 
          class="flex items-center w-10 gap-1 button-lighter-visible" 
          title="Delete card">
          <Trash2 :size="18" />
        </button>
        <button @click="emit('duplicate')" 
          class="flex items-center w-10 gap-1 button-lighter-visible" 
          title="Duplicate card">
          <Copy :size="18" />
        </button>
        <div class="w-px bg-neutral-800"></div>
        <button @click="resetForm" 
          :disabled="!hasChanges" 
          :class="[
            'button-lighter-visible flex items-center gap-2 w-10 md:w-24',
            { 'text-neutral-600 pointer-events-none': !hasChanges }
          ]">
          <RotateCcw :size="18" />
          <span class="hidden md:inline">Reset</span>
        </button>
        <button @click="handleUpdate" 
          :disabled="!editFrontContent.trim() || editFrontContent.trim() === '<p></p>' || editFrontContent.trim() === '<p><br></p>' || !hasChanges" 
          :class="[
            editFrontContent.trim() && editFrontContent.trim() !== '<p></p>' && editFrontContent.trim() !== '<p><br></p>' && hasChanges
              ? 'button-accept-visible flex items-center gap-2 w-10 md:w-24'
              : 'button-lighter-visible flex items-center gap-2 w-10 md:w-24',
            { 'text-neutral-600 pointer-events-none': !editFrontContent.trim() || editFrontContent.trim() === '<p></p>' || editFrontContent.trim() === '<p><br></p>' || !hasChanges }
          ]">
          <Save :size="18" />
          <span class="hidden md:inline">Save</span>
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
        <QuillEditor
          :key="`front-${props.card.id}`"
          v-model:content="editFrontContent"
          contentType="html"
          toolbar="essential"
          theme="snow"
        />
      </div>

      <!-- Back Content -->
      <div class="space-y-2">
        <label class="block text-sm text-neutral-400">Back</label>
        <QuillEditor
          :key="`back-${props.card.id}`"
          v-model:content="editBackContent"
          contentType="html"
          toolbar="essential"
          theme="snow"
        />
      </div>

      <div class="h-px bg-neutral-800"></div>

      <!-- Tags and Position Section -->
      <div class="flex gap-2">
        <!-- Tags Section -->
        <div class="flex-1 space-y-2">
          <label class="block text-sm text-neutral-400">Tags</label>
          <div class="relative">
            <input 
              v-model="newTag" 
              @keydown.enter.prevent="addTag" 
              type="text" 
              class="w-full input-lighter-filled"
              placeholder="Type a tag and press Enter" 
            />
            <p v-if="tagError" class="absolute mt-1 text-sm text-red-500">{{ tagError }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in editTags" :key="tag"
              class="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-neutral-800">
              {{ tag }}
              <button @click="removeTag(tag)" class="pl-1 transition-colors rounded-full hover:text-red-400">
                <X :size="14" />
              </button>
            </span>
          </div>
        </div>

        <!-- Position Section -->
        <div class="space-y-2 w-28">
          <label class="block text-sm text-neutral-400">Position</label>
          <input
            type="number"
            :value="editPosition"
            @input="handlePositionInput"
            @keydown.stop
            class="w-full input-lighter-filled"
            min="1"
            placeholder="#"
          />
        </div>
      </div>
    </div>
  </div>
</template>