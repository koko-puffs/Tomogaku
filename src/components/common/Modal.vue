<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md p-6 rounded-lg bg-neutral-900">
            <h3 class="mb-4 text-lg font-medium">
                <slot name="title" />
            </h3>
            <div class="mb-6">
                <slot name="content" />
            </div>
            <div class="flex justify-end space-x-4">
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>