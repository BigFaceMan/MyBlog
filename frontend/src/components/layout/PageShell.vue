<template>
  <section class="page-shell">
    <div class="page-shell__content">
      <slot />
    </div>
    <aside v-if="withSidebar" class="page-shell__sidebar">
      <SidebarPanel />
    </aside>
  </section>
</template>

<script setup lang="ts">
import SidebarPanel from "@/components/sidebar/SidebarPanel.vue";

withDefaults(
  defineProps<{
    withSidebar?: boolean;
  }>(),
  {
    withSidebar: true
  }
);
</script>

<style scoped>
.page-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 42px 0 64px;
}

.page-shell__content,
.page-shell__sidebar {
  min-width: 0;
}

.page-shell__sidebar {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  align-self: start;
}

@media (max-width: 980px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .page-shell__sidebar {
    position: static;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 24px, 1240px);
    padding-top: 24px;
  }
}
</style>
