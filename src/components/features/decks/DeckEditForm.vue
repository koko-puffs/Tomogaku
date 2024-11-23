<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Globe2, Lock } from 'lucide-vue-next';
import ToggleSlider from '../../common/ToggleSlider.vue';

const props = defineProps<{
    title: string;
    description: string | null;
    tags: string[] | null;
    visibility: 'private' | 'public';
}>();

const editTitle = ref(props.title);
const editDescription = ref(props.description || '');
const editTags = ref<string[]>([...(props.tags || [])]);
const newTag = ref('');
const tagError = ref('');
const editVisibility = ref<'private' | 'public'>(props.visibility);

const isPublic = computed({
    get: () => editVisibility.value === 'public',
    set: (value: boolean) => {
        editVisibility.value = value ? 'public' : 'private';
    }
});

const emit = defineEmits<{
    'update': [{ title: string, description: string | null, tags: string[] | null, visibility: 'private' | 'public' }];
    'cancel': [];
}>();

const handleUpdate = () => {
    if (!editTitle.value) return;

    emit('update', {
        title: editTitle.value,
        description: editDescription.value || null,
        tags: editTags.value.length > 0 ? editTags.value : null,
        visibility: editVisibility.value,
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
</script>

<template>
    <div class="p-4 panel">
        <div class="space-y-4">
            <div class="space-y-2">
                <label class="block text-sm">Title</label>
                <input v-model="editTitle" type="text" class="w-full input-lighter-filled" placeholder="Enter deck title" />
            </div>

            <div class="space-y-2">
                <label class="block text-sm">Description (optional)</label>
                <textarea v-model="editDescription" rows="3" class="w-full h-48 resize-none input-lighter-filled !-mb-2"
                    placeholder="Enter deck description" />
            </div>

            <div class="space-y-2">
                <label class="block text-sm">Tags (optional)</label>
                <div class="relative space-y-2">
                    <input v-model="newTag" @keydown.enter.prevent="addTag" type="text" class="w-full input-lighter-filled"
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
                        <ToggleSlider v-model="isPublic" />
                        <div class="flex items-center gap-1.5">
                            <component :is="editVisibility === 'public' ? Globe2 : Lock" :size="16" class="text-neutral-400" />
                            <span class="-mb-0.5 text-sm font-medium"
                                :class="editVisibility === 'public' ? 'text-green-400' : 'text-neutral-400'">
                                {{ editVisibility === 'public' ? 'Public' : 'Private' }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button @click="emit('cancel')" class="w-24 button-lighter">Cancel</button>
                    <button @click="handleUpdate" :disabled="!editTitle" class="w-24 button-accept-visible">Save</button>
                </div>
            </div>
        </div>
    </div>
</template>