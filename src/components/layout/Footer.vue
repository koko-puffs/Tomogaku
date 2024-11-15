<template>
    <footer class="pt-8 mt-auto border-t pb-14 border-neutral-800">
      <div class="container px-6 mx-auto">
        <!-- Changed to flex container with justify-between -->
        <div class="flex flex-col justify-between gap-8 md:flex-row">
          <!-- Left side -->
          <div class="space-y-3">
            <h3 class="text-xl font-bold">共学 / tomogaku</h3>
            <p class="text-sm text-neutral-400">
              &copy; {{ new Date().getFullYear() }} Tomogaku. All rights reserved.
            </p>
          </div>
  
          <!-- Right side with Support and Legal -->
          <div class="flex flex-col gap-8 md:flex-row md:gap-16">
            <!-- Support -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold">Support</h4>
              <ul class="space-y-1">
                <li>
                  <router-link to="/contact" class="text-sm text-neutral-400 hover:text-white">Contact</router-link>
                </li>
                <li>
                  <a href="https://discord.gg/tomogaku" target="_blank" class="text-sm text-neutral-400 hover:text-white">Discord Community</a>
                </li>
              </ul>
            </div>
  
            <!-- Legal -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold">Legal</h4>
              <ul class="space-y-1">
                <li>
                  <router-link to="/privacy" class="text-sm text-neutral-400 hover:text-white">Privacy Policy</router-link>
                </li>
                <li>
                  <router-link to="/terms" class="text-sm text-neutral-400 hover:text-white">Terms of Service</router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </template>
  
  <script setup lang="ts">
  // No additional setup needed
  </script>