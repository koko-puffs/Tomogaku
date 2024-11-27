<template>
    <div class="fixed inset-0 z-50 flex justify-center px-4 bg-black/50" @click="$emit('close')">
        <div class="relative w-[500px] h-fit mt-20 bg-neutral-900 rounded-lg shadow-xl border border-neutral-800 motion-translate-y-in-[-2%] motion-opacity-in-[0%] motion-duration-[0.2s]"
            @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-3 py-3 border-b border-neutral-800">
                <h2 class="pl-2 text-xl font-semibold">
                    <slot name="title" />
                </h2>
                <button @click="$emit('close')" class="p-2 rounded-lg hover:bg-neutral-800">
                    <X :size="20" />
                </button>
            </div>

            <!-- Content area -->
            <div class="p-6">
                <slot name="content" />
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 px-3 py-3 border-t border-neutral-800">
                <slot name="footer" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { onMounted, onUnmounted } from 'vue';

defineEmits(['close']);

onMounted(() => {
    document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
    document.body.style.overflow = 'auto';
});
</script>