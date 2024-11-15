import { createApp } from "vue";
import "./styles/main.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import { useAuthStore } from "./stores/authStore.ts";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(createPinia());
app.use(autoAnimatePlugin);
const authStore = useAuthStore();

app.provide("authStore", authStore);

app.mount("#app");
