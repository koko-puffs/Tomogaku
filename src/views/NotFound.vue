<template>
    <div class="flex items-center justify-center mt-12 motion-preset-fade motion-duration-150">
        <div class="text-center ">
            <h1
                class="text-[120px] md:text-[150px] font-bold bg-gradient-to-r from-red-600 to-pink-400 text-transparent bg-clip-text animate-pulse">
                404
            </h1>

            <h2 class="mb-4 text-3xl font-bold md:text-4xl">
                Oops! Could not find that page.
            </h2>

            <p class="mb-8 text-lg text-neutral-500 motion-preset-typewriter ">
                The page you are looking for might have been removed, had its name changed,
                or is temporarily unavailable.
            </p>

            <div class="flex justify-center">
                <router-link to="/"
                    class="w-24 h-10 text-sm button-visible">
                    Return
                </router-link>
            </div>
        </div>
    </div>
</template>