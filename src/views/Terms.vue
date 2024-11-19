<template>
    <div class="max-w-3xl px-6 py-8 mx-auto">
        <div class="prose prose-lg prose-slate max-w-none" v-html="formattedTerms"></div>
    </div>
</template>

<script setup lang="ts">
import termsText from '../assets/terms.txt?raw'
import { marked } from 'marked'
import { computed } from 'vue'

const formattedTerms = computed(() => {
    return marked(termsText)
})
</script>

<style>
.prose h1 {
    @apply text-4xl font-bold mb-6;
}

.prose h2 {
    @apply text-2xl font-bold mt-8 mb-4;
}

.prose p {
    @apply text-lg text-neutral-300;
}

.prose ul {
    @apply my-4 text-lg text-neutral-300;
}
</style>