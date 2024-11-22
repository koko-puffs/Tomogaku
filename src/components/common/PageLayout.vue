<template>
    <div class="min-h-screen">
        <div class="grid grid-cols-[25fr_1px_75fr] h-full">
            <!-- Left Sidebar -->
            <div class="h-[calc(100vh-56px)] sticky top-14 overflow-y-auto py-4 pr-4 w-[260px]">
                <slot name="sidebar" />
            </div>

            <!-- Divider -->
            <div class="w-px min-h-screen bg-neutral-800"></div>

            <!-- Right Content Area -->
            <div class="min-h-screen py-4 pl-4 max-w-[780px] min-w-[380px]">
                <slot name="content" />
            </div>
        </div>
    </div>
</template>