<template>
    <div class="min-h-screen">
        <!-- Mobile Overlay with Transition -->
        <Transition enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="sidebarStore.isOpen" class="fixed inset-0 z-30 bg-black/50 md:hidden"
                @click="sidebarStore.toggle()"></div>
        </Transition>

        <!-- Main Grid Layout - responsive -->
        <div class="grid md:grid-cols-[25fr_1px_75fr] grid-cols-[1fr] h-full w-full">
            <!-- Left Sidebar - mobile responsive -->
            <div class="relative max-md:fixed max-md:w-[275px] md:sticky left-0 top-14 h-[calc(100vh-56px)] md:z-0 z-40 md:bg-transparent bg-neutral-950/75 backdrop-blur-md
                       bg-background py-4 pr-4 pl-4 md:pl-0 md:w-[260px] transition-transform duration-200
                       md:translate-x-0 border-r border-neutral-800 md:border-none overflow-y-auto"
                :class="[sidebarStore.isOpen ? 'translate-x-0' : '-translate-x-[275px]']"
                style="scrollbar-gutter: stable;">
                <div class="md:-mr-[10px]">
                    <slot name="sidebar" />
                </div>
            </div>

            <!-- Divider - hidden on mobile -->
            <div class="hidden w-px min-h-screen bg-neutral-800 md:block"></div>

            <!-- Right Content Area -->
            <div class="min-h-screen px-3 py-4 md:px-0 md:pl-4 max-w-[780px] sm:min-w-[480px] min-w-[380px]">
                <slot name="content" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { useSidebarStore } from '../../stores/sidebarStore'

const sidebarStore = useSidebarStore()
</script>