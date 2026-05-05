<template>
  <div class="sidebar-panel">
    <AuthorCard />
    <AnnouncementCard />
    <RecentPostsCard />
    <TaxonomyCard />
  </div>
</template>

<script setup lang="ts">
import AnnouncementCard from "@/components/sidebar/AnnouncementCard.vue";
import AuthorCard from "@/components/sidebar/AuthorCard.vue";
import RecentPostsCard from "@/components/sidebar/RecentPostsCard.vue";
import TaxonomyCard from "@/components/sidebar/TaxonomyCard.vue";
</script>

<style scoped>
.sidebar-panel {
  display: grid;
  gap: 18px;
}
</style>
