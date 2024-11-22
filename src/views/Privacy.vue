<template>
    <div class="max-w-3xl px-6 py-8 mx-auto motion-preset-fade motion-duration-150">
        <div class="prose prose-lg prose-slate max-w-none" v-html="formattedPrivacy"></div>
    </div>
</template>

<script setup lang="ts">
import privacyText from '../assets/privacy.txt?raw'
import { marked } from 'marked'
import { computed } from 'vue'

const formattedPrivacy = computed(() => {
    return marked(privacyText)
})
</script>