<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Card } from '../../../types/deck.types';
// Import Quill CSS
import '../../../styles/quill.css';

const props = defineProps<{
    card: Card;
    preview?: boolean;
}>();

const emit = defineEmits<{
    (e: 'flipped'): void;
}>();

const isFlipped = ref(false);

const flipCard = () => {
    isFlipped.value = true;
    emit('flipped');
};

const resetCard = () => {
    isFlipped.value = false;
};

// Reset flip state when card changes
watch(() => props.card, () => {
    isFlipped.value = false;
}, { immediate: true });
</script>

<template>
    <div class="space-y-6">
        <!-- Card content -->
        <div class="panel min-h-[490px]" :class="preview ? 'bg-neutral-900' : 'bg-neutral-950/50'"> 
            <!-- Front content (always visible) -->
            <div class="px-3 py-3 rounded-lg">
                <div class="ql-snow">
                    <div class="p-6 !rounded-lg ql-editor ql-container border-none !bg-transparent">
                        <div v-html="card.front_content"></div>
                    </div>
                </div>
            </div>

            <!-- Back content (visible after flip) -->
            <template v-if="isFlipped">
                <div class="h-px bg-neutral-800"></div>
                <div class="px-3 py-3 rounded-lg">
                    <div class="ql-snow">
                        <div class="p-6 !rounded-lg ql-editor ql-container border-none !bg-transparent">
                            <div v-html="card.back_content"></div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-center" v-if="!isFlipped">
            <button @click="flipCard" class="px-4" :class="preview ? 'button-visible' : 'button-lighter-visible'">
                Show Answer
            </button>
        </div>
        <div class="flex justify-center" v-else-if="preview">
            <button @click="resetCard" class="px-4 button-visible">
                Reset
            </button>
        </div>
    </div>
</template>