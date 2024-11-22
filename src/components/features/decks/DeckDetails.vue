<script setup lang="ts">
import { Pencil, Trash2, NotepadText, X, Globe2, Lock } from 'lucide-vue-next';
import { ref, watch, computed } from 'vue';
import ToggleSlider from '../../common/ToggleSlider.vue';

const props = defineProps<{
    deck: any;
}>();

const isEditing = ref(false);
const editTitle = ref('');
const editDescription = ref('');
const editTags = ref<string[]>([]);
const newTag = ref('');
const tagError = ref('');
const editVisibility = ref<'private' | 'public'>('private');

const isPublic = computed({
    get: () => editVisibility.value === 'public',
    set: (value: boolean) => {
        editVisibility.value = value ? 'public' : 'private';
    }
});

const emit = defineEmits<{
    'edit': [];
    'delete': [];
    'study': [];
    'cards': [];
    'update': [{ title: string, description: string | null, tags: string[] | null, visibility: 'private' | 'public' }];
}>();

// Watch for changes to the deck prop
watch(() => props.deck.id, () => {
    isEditing.value = false;
    tagError.value = '';
});

const startEdit = () => {
    isEditing.value = true;
    editTitle.value = props.deck.title;
    editDescription.value = props.deck.description || '';
    editTags.value = [...(props.deck.tags || [])];
    editVisibility.value = props.deck.visibility === 'public' ? 'public' : 'private';
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
        visibility: editVisibility.value,
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
    <div class="space-y-2">
        <!-- Deck Header -->
        <div class="flex items-center justify-between w-full">
            <!-- Edit Mode -->
            <div v-if="isEditing" 
                 class="flex-1 w-full motion-translate-y-in-[-1.4%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
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

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-3">
                                <span class="text-sm -mb-0.5">Visibility:</span>
                                <ToggleSlider
                                    v-model="isPublic"
                                />
                                <div class="flex items-center gap-1.5">
                                    <component 
                                        :is="editVisibility === 'public' ? Globe2 : Lock"
                                        :size="16"
                                        class="text-neutral-400"
                                    />
                                    <span 
                                        class="-mb-0.5 text-sm font-medium"
                                        :class="editVisibility === 'public' ? 'text-green-400' : 'text-orange-400'"
                                    >
                                        {{ editVisibility === 'public' ? 'Public' : 'Private' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button @click="cancelEdit" class="w-24 button-visible">Cancel</button>
                            <button @click="handleUpdate" :disabled="!editTitle" class="w-24 button-accept-visible">Save</button>
                        </div>
                    </div>
                </div>
                
                <div class="h-px my-6 bg-neutral-800"></div>
            </div>

            <!-- View Mode -->
            <template v-else>
                <div class="motion-translate-y-in-[-12%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
                    <h1 class="relative flex items-center gap-1.5 text-xl font-bold group pl-1 max-w-[300px]">
                        <span class="truncate">{{ props.deck.title }}</span>
                        <NotepadText v-if="props.deck.description" :size="18" class="flex-shrink-0 mb-0.5 text-neutral-500" />
                        <div v-if="props.deck.description"
                            class="absolute invisible p-2 border border-neutral-800 text-sm transition-all font-medium -translate-x-1/2 translate-y-2 rounded-md opacity-0 left-1/2 top-full bg-neutral-900 group-hover:visible group-hover:opacity-100 min-w-[300px] max-w-[500px] text-neutral-400 shadow-lg whitespace-pre-wrap"
                            v-html="props.deck.description.replace(/\n/g, '<br />')">
                        </div>
                    </h1>
                </div>
            </template>

            <!-- Buttons -->
            <div v-if="!isEditing" 
                 class="flex space-x-2 motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.35s] motion-duration-[0.25s]/opacity">
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
        <div v-if="props.deck.tags?.length && !isEditing" 
             class="flex flex-wrap gap-2">
            <span v-for="tag in props.deck.tags" :key="tag"
                class="px-2 py-1 text-xs rounded-md bg-neutral-800 text-neutral-400">
                {{ tag }}
            </span>
        </div>

        <!-- Deck Stats -->
        <div class="p-3 space-y-2 panel">
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
    </div>
</template>