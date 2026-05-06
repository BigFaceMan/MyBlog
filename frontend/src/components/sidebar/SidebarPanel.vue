<template>
  <div class="sidebar-panel">
    <AuthorCard />
    <AnnouncementCard />
    <TaxonomyCard />
  </div>
</template>

<script setup lang="ts">
import AnnouncementCard from "@/components/sidebar/AnnouncementCard.vue";
import AuthorCard from "@/components/sidebar/AuthorCard.vue";
import TaxonomyCard from "@/components/sidebar/TaxonomyCard.vue";
</script>

<style scoped>
.sidebar-panel {
  display: grid;
  gap: 18px;
}
</style>
