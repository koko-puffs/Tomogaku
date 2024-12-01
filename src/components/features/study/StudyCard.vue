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
    (e: 'flipped', isFlipped: boolean): void;
}>();

const isFlipped = ref(false);

const flipCard = () => {
    if (!isFlipped.value) {
        isFlipped.value = true;
        emit('flipped', true);
    }
};

const resetCard = () => {
    isFlipped.value = false;
    emit('flipped', false);
};

// Reset flip state when card changes
watch(() => props.card, () => {
    isFlipped.value = false;
    emit('flipped', false);
}, { immediate: true });

defineExpose({
    flipCard,
    resetCard
});
</script>

<template>
    <div class="h-full space-y-6">
        <!-- Card content -->
        <div class="h-full overflow-auto panel motion-opacity-in-[0%] motion-duration-[0.075s]/opacity" :class="preview ? 'bg-neutral-900' : 'bg-neutral-950/50'"> 
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
        <div class="flex justify-center motion-opacity-in-[0%] motion-duration-[0.075s]/opacity" v-if="!isFlipped">
            <button @click="flipCard" class="px-4" :class="preview ? 'button-visible' : 'button-lighter-visible'">
                Show Answer
            </button>
        </div>
        <div class="flex justify-center motion-opacity-in-[0%] motion-duration-[0.075s]/opacity" v-else-if="preview">
            <button @click="resetCard" class="px-4 button-visible">
                Reset
            </button>
        </div>
    </div>
</template>