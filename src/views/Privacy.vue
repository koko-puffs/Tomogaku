<template>
    <div class="max-w-3xl px-6 py-8 mx-auto motion-preset-fade motion-duration-150">
        <div class="prose prose-lg prose-slate max-w-none" v-html="formattedPrivacy"></div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useSidebarStore } from '../stores/sidebarStore';
import privacyText from '../assets/privacy.txt?raw'
import { marked } from 'marked'
import { computed } from 'vue'

const sidebarStore = useSidebarStore();

const formattedPrivacy = computed(() => {
    return marked(privacyText)
})

onMounted(() => {
    sidebarStore.setShowBackButton(true);
});

onUnmounted(() => {
    sidebarStore.setShowBackButton(false);
});
</script>