<template>
  <section class="sidebar-card">
    <h2 class="sidebar-card__title">
      <Bell :size="20" />
      {{ t("sidebar.announcement") }}
    </h2>
    <p class="announcement-card__body">{{ siteStore.profile?.announcement ?? t("common.loading") }}</p>
  </section>
</template>

<script setup lang="ts">
import { useSiteStore } from "@/stores/site";
import { Bell } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const siteStore = useSiteStore();
</script>

<style scoped>
.announcement-card__body {
  margin: 0;
  color: var(--text-regular);
  line-height: 1.8;
}
</style>
