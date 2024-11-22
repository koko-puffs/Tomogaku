<template>
    <div class="max-w-3xl px-6 py-8 mx-auto motion-preset-fade motion-duration-150">
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