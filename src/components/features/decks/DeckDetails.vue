<script setup lang="ts">
import { Pencil, Trash2, NotepadText, X } from 'lucide-vue-next';
import { ref } from 'vue';

const props = defineProps<{
    deck: any;
}>();

const isEditing = ref(false);
const editTitle = ref('');
const editDescription = ref('');
const editTags = ref<string[]>([]);
const newTag = ref('');
const tagError = ref('');

const emit = defineEmits<{
    'edit': [];
    'delete': [];
    'study': [];
    'cards': [];
    'update': [{ title: string, description: string | null, tags: string[] | null }];
}>();

const startEdit = () => {
    isEditing.value = true;
    editTitle.value = props.deck.title;
    editDescription.value = props.deck.description || '';
    editTags.value = [...(props.deck.tags || [])];
};

const cancelEdit = () => {
    isEditing.value = false;
    tagError.value = '';
};

const handleUpdate = () => {
    if (!editTitle.value) return;
    
    emit('update', {
        title: editTitle.value,
        description: editDescription.value || null,
        tags: editTags.value.length > 0 ? editTags.value : null,
    });
    isEditing.value = false;
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
</script>

<template>
    <div class="space-y-2 motion-preset-fade motion-duration-100">
        <!-- Deck Header -->
        <div class="flex items-center justify-between w-full">
            <!-- Edit Mode -->
            <div v-if="isEditing" class="flex-1">
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="block text-sm">Title</label>
                        <input v-model="editTitle" type="text" class="w-full input-filled" placeholder="Enter deck title" />
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-sm">Description (optional)</label>
                        <textarea v-model="editDescription" rows="3" class="w-full h-24 resize-none input-filled !-mb-2"
                            placeholder="Enter deck description" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm">Tags (optional)</label>
                        <div class="relative space-y-2">
                            <input v-model="newTag" @keydown.enter.prevent="addTag" type="text" class="w-full input-filled"
                                placeholder="Type a tag and press Enter" />
                            <p v-if="tagError" class="text-sm text-red-500">{{ tagError }}</p>
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

                    <div class="flex justify-end gap-2">
                        <button @click="cancelEdit" class="w-24 button-visible">Cancel</button>
                        <button @click="handleUpdate" :disabled="!editTitle" class="w-24 button-accept-visible">Save</button>
                    </div>
                </div>
                
                <div class="h-px my-6 bg-neutral-800"></div>
            </div>

            <!-- View Mode -->
            <template v-else>
                <h1 class="relative flex items-center gap-1.5 text-xl font-bold group pl-1">
                    {{ props.deck.title }}
                    <NotepadText v-if="props.deck.description" :size="18" class="text-neutral-500" />
                    <div v-if="props.deck.description"
                        class="absolute invisible p-2 border border-neutral-800 text-sm transition-all font-medium -translate-x-1/2 translate-y-2 rounded-md opacity-0 left-1/2 top-full bg-neutral-900 group-hover:visible group-hover:opacity-100 min-w-[300px] max-w-[500px] text-neutral-400 shadow-lg">
                        {{ props.deck.description }}
                    </div>
                </h1>
            </template>

            <!-- Buttons -->
            <div v-if="!isEditing" class="flex space-x-2">
                <button class="w-10 h-10 button-visible" @click="startEdit">
                    <Pencil :size="18" />
                </button>
                <button @click="emit('delete')" class="w-10 h-10 button-visible">
                    <Trash2 :size="18" />
                </button>
                <button class="w-28 button-visible" @click="emit('cards')">
                    View cards
                </button>
                <button class="w-28 button-accept-visible" @click="emit('study')">
                    Study
                </button>
            </div>
        </div>

        <!-- Tags Section -->
        <div v-if="props.deck.tags?.length && !isEditing" class="flex flex-wrap gap-2">
            <span v-for="tag in props.deck.tags" :key="tag"
                class="px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                {{ tag }}
            </span>
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
    </div>
</template>