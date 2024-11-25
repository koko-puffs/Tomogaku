<script setup lang="ts">
import { Pencil, Trash2, Globe2, BookOpen, Layers3, MoreVertical } from 'lucide-vue-next';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import DeckEditForm from './DeckEditForm.vue';
import { useAuthStore } from '../../../stores/authStore';

const props = defineProps<{
    deck: any;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Add ownership check
const isOwner = computed(() => {
    return authStore.user?.id === props.deck.user_id;
});

// Initialize isEditing based on URL hash AND ownership
const isEditing = ref(route.hash === '#edit' && isOwner.value);

// Watch for deck changes to reset edit mode
watch(() => props.deck.id, () => {
    isEditing.value = false;
});

// Update the URL when edit state changes, but only if owner
watch(isEditing, (newValue) => {
    if (!isOwner.value) return;

    if (newValue) {
        router.replace({ hash: '#edit' });
    } else {
        router.replace({ hash: '' });
    }
});

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const emit = defineEmits<{
    'edit': [];
    'delete': [];
    'study': [];
    'cards': [];
    'update': [{ title: string, description: string | null, tags: string[] | null, visibility: 'private' | 'public' }];
}>();

const handleUpdate = (updatedData: {
    title: string,
    description: string | null,
    tags: string[] | null,
    visibility: 'private' | 'public'
}) => {
    emit('update', updatedData);
    isEditing.value = false;
};

const startEdit = () => {
  if (!isOwner.value) return;
  isEditing.value = true;
  closeDropdown();
};

const handleDelete = () => {
  emit('delete');
  closeDropdown();
};

const cancelEdit = () => {
    isEditing.value = false;
};

// Watch for hash changes to prevent non-owners from accessing edit mode
watch(() => route.hash, (newHash) => {
    if (newHash === '#edit' && !isOwner.value) {
        router.replace({ hash: '' });
    }
});
</script>

<template>
    <div class="space-y-4">
        <!-- Deck Header -->
        <div class="flex items-center justify-between w-full relative z-[5]">
            <!-- Edit Mode -->
            <div v-if="isEditing"
                class="flex-1 w-full motion-translate-y-in-[-1.4%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                <DeckEditForm :title="props.deck.title" :description="props.deck.description" :tags="props.deck.tags"
                    :visibility="props.deck.visibility" @update="handleUpdate" @cancel="cancelEdit" />
                <div class="h-px mt-6 mb-2 bg-neutral-800"></div>
            </div>

            <!-- View Mode -->
            <template v-else>
                <div
                    class="motion-translate-y-in-[-12%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                    <div class="space-y-1">
                        <h1 class="relative flex items-center gap-1.5 text-xl font-bold pl-1 max-w-[195px] md:max-w-[280px] lg:max-w-[350px]">
                            <span class="leading-none truncate">{{ props.deck.title }}</span>
                        </h1>
                        <RouterLink v-if="props.deck.visibility === 'public'" :to="`/discover/deck/${props.deck.id}`"
                            class="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 transition-colors pl-1">
                            <Globe2 :size="14" />
                            <span class="leading-none">View public page</span>
                        </RouterLink>
                    </div>
                </div>
            </template>

            <!-- Buttons -->
            <div v-if="!isEditing"
                class="flex gap-2 motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity relative z-[5]">
                <div v-if="isOwner" class="relative z-[5]" ref="dropdownRef">
                    <!-- Show dropdown button on small screens -->
                    <button @click.stop="toggleDropdown" class="w-10 button lg:hidden">
                        <MoreVertical :size="18" />
                    </button>

                    <!-- Dropdown menu -->
                    <div v-if="isDropdownOpen"
                        class="absolute right-0 w-48 py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-x-in-[0%] motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity z-[5]">
                        <button @click="emit('cards'); closeDropdown()"
                            class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
                            <Layers3 :size="16" class="mr-2" />
                            Cards
                        </button>
                        <button @click="startEdit"
                            class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
                            <Pencil :size="16" class="mr-2" />
                            Edit
                        </button>
                        <button @click="handleDelete"
                            class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800">
                            <Trash2 :size="16" class="mr-2" />
                            Delete
                        </button>
                    </div>

                    <!-- Show regular buttons on large screens -->
                    <div class="hidden lg:flex">
                        <button class="w-10 button" @click="startEdit">
                            <Pencil :size="18" />
                        </button>
                        <button @click="handleDelete" class="w-10 button">
                            <Trash2 :size="18" />
                        </button>
                        <button class="flex items-center gap-2 ml-2 w-28 button-visible" @click="emit('cards')">
                            <Layers3 :size="18" />
                            <span>Cards</span>
                        </button>
                    </div>
                </div>
                <button class="flex items-center gap-2 button-pink-visible w-28" @click="emit('study')">
                    <BookOpen :size="18" />
                    <span>Study</span>
                </button>
            </div>
        </div>

        <!-- Stats and Description -->
        <div class="space-y-2 motion-translate-y-in-[-2%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity relative z-[1]">
            <!-- Deck Stats -->
            <div class="px-4 py-3 space-y-2 panel">
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-neutral-400">New:</span>
                        <span class="text-cyan-400">10</span>
                    </div>
                    <div class="h-px bg-neutral-800"></div>

                    <div class="flex items-center justify-between py-0.5">
                        <span class="text-neutral-400">To-review:</span>
                        <span class="text-green-400">25</span>
                    </div>
                    <div class="h-px bg-neutral-800"></div>

                    <div class="flex items-center justify-between">
                        <span class="text-neutral-400">Learning:</span>
                        <span class="text-orange-400">60</span>
                    </div>
                </div>
            </div>

            <!-- Description and Tags Panel -->
            <div v-if="props.deck.description || props.deck.tags?.length" class="p-2.5 space-y-2.5 panel">
                <!-- Description -->
                <div v-if="props.deck.description" class="px-1.5 py-1 space-y-2">
                    <h3 class="text-sm font-medium text-neutral-400">Description</h3>
                    <p class="break-words whitespace-pre-wrap text-neutral-200">{{ props.deck.description }}</p>
                </div>

                <!-- Tags -->
                <div v-if="props.deck.tags?.length" class="space-y-2">
                    <div class="flex flex-wrap gap-2">
                        <span v-for="tag in props.deck.tags" :key="tag"
                            class="px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                            {{ tag }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>