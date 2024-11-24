<template>
    <div class="flex items-center justify-center mt-12 motion-preset-fade motion-duration-150">
        <div class="text-center ">
            <h1
                class="text-[70px] md:text-[90px] font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-transparent bg-clip-text">
                {{ randomMessage }}
            </h1>

            <h2 class="mt-4 mb-1 text-3xl font-bold md:text-4xl">
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

<script setup>
const messages = [
    'Uh-oh!',
    'Nope!',
    'Oh snap!',
    'Whoops!',
    'D\'oh!',
    'Yikes!',
    'Nada!',
    'MIA!',
    'Gone!',
    'Poof!',
    'Zip!',
    'Nuh-uh!',
    'Welp!',
    'Huh?',
    'Lost!',
    '404!',
    'Nope!',
    'Bzzt!',
    'Meep!',
    'Eek!',
    'Wut?',
    'Hmm...',
    'Derp!',
    '???',
    '(╯°□°）╯',
    '(；一_一)',
    '(>_<)',
    '¯\\_(ツ)_/¯',
    '(≧﹏≦)',
    '(｡T ω T｡)',
    '(╥﹏╥)',
    '(；⌣̀_⌣́)',
    '(˚ ˃̣̣̥⌓˂̣̣̥)',
    '(⊙_⊙)',
    '(◎_◎;)',
    '(●__●)',
    '(×_×)',
    '(￣ω￣;)',
    '(⊙﹏⊙)',
    '(-_-;)・・・',
    '(￣▽￣*)ゞ',
    '(＠_＠)',
    '(╯︵╰,)',
    '(っ °Д °;)っ',
    '(｡╯︵╰｡)',
    '(●´⌓`●)',
    '(｡•́︿•̀｡)',
    '(๑•﹏•)',
    '(ノ_<。)',
    '(´-﹏-`；)',
    'ಥ_ಥ',
    '(｡ŏ﹏ŏ)',
    '(´。＿。｀)',
    '(๑´•.̫ • `๑)',
    '(´･_･`)'
];

const randomMessage = messages[Math.floor(Math.random() * messages.length)];
</script>