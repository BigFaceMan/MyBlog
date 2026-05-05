<template>
  <div class="app-root">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue";
import { useSiteStore } from "@/stores/site";

const siteStore = useSiteStore();

void siteStore.loadProfile();
</script>

<style scoped>
.app-root {
  min-height: 100vh;
}

.app-main {
  min-height: calc(100vh - var(--header-height));
}
</style>
