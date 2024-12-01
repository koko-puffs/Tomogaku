<template>
    <div class="min-h-screen">
        <!-- Mobile Overlay with Transition -->
        <Transition enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="sidebarStore.isOpen" class="fixed inset-0 z-30 bg-black/50 sm:hidden"
                @click="sidebarStore.toggle()"></div>
        </Transition>

        <!-- Main Grid Layout - responsive -->
        <div class="grid md:grid-cols-[25fr_1px_75fr] grid-cols-[1fr] h-full w-full">
            <!-- Left Sidebar - mobile responsive -->
            <div class="absolute md:sticky md:block left-0 top-14 md:h-[calc(100vh-56px)] h-full md:z-0 z-40 md:bg-transparent bg-neutral-950/75 backdrop-blur-md
                       bg-background overflow-y-auto py-4 pr-4 pl-4 md:pl-0 w-[275px] md:w-[260px] transition-transform duration-300
                       md:translate-x-0 border-r border-neutral-800 md:border-none"
                :class="[sidebarStore.isOpen ? 'translate-x-0' : '-translate-x-[275px]']">
                <slot name="sidebar" />
            </div>

            <!-- Divider - hidden on mobile -->
            <div class="hidden w-px min-h-screen bg-neutral-800 md:block"></div>

            <!-- Right Content Area -->
            <div class="min-h-screen px-3 py-4 md:px-0 md:pl-4 max-w-[780px] min-w-[380px]">
                <slot name="content" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { useSidebarStore } from '../../stores/sidebarStore'

const sidebarStore = useSidebarStore()
</script>