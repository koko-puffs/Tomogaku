<template>
    <div class="flex items-center justify-center mt-12 motion-preset-fade motion-duration-150">
        <!-- Gradient overlay -->
        <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-amber-950/5 to-transparent"></div>
        <div class="text-center ">
            <h1
                class="text-[120px] md:text-[150px] font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-transparent bg-clip-text">
                404
            </h1>

            <h2 class="mb-2 text-3xl font-bold md:text-4xl">
                Oops! Could not find that page.
            </h2>

            <p class="mb-10 text-lg text-neutral-500 motion-preset-typewriter ">
                The page you are looking for might have been removed, had its name changed,
                or is temporarily unavailable.
            </p>

            <div class="flex justify-center">
                <router-link to="/" class="w-24 h-10 text-sm button-visible">
                    Return
                </router-link>
            </div>
        </div>
    </div>
</template>