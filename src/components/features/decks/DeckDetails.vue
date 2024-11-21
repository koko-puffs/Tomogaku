<script setup lang="ts">
import { Pencil, Trash2, NotepadText } from 'lucide-vue-next';

const props = defineProps<{
    deck: any; // Replace with proper type
}>();

const emit = defineEmits<{
    'edit': [];
    'delete': [];
    'study': [];
}>();
</script>

<template>
    <div class="space-y-2">
        <!-- Deck Header -->
        <div class="flex items-center justify-between w-full">
            <h1 class="relative flex items-center gap-1.5 text-xl font-bold group pl-1">
                {{ props.deck.title }}
                <NotepadText v-if="props.deck.description" :size="18" class="text-neutral-500" />
                <div v-if="props.deck.description"
                    class="absolute invisible p-2 border border-neutral-800 text-sm transition-all font-medium -translate-x-1/2 translate-y-2 rounded-md opacity-0 left-1/2 top-full bg-neutral-900 group-hover:visible group-hover:opacity-100 min-w-[300px] max-w-[500px] text-neutral-400 shadow-lg">
                    {{ props.deck.description }}
                </div>
            </h1>
            <div class="flex space-x-2">
                <button class="w-10 h-10 button-visible" @click="emit('edit')">
                    <Pencil :size="18" />
                </button>
                <button @click="emit('delete')" class="w-10 h-10 button-visible">
                    <Trash2 :size="18" />
                </button>
                <button class="w-36 button-accept-visible" @click="emit('study')">
                    Study
                </button>
            </div>
        </div>

        <!-- Tags Section -->
        <div v-if="props.deck.tags?.length" class="flex flex-wrap gap-2">
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