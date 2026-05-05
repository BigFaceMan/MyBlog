<template>
  <PageShell :with-sidebar="false">
    <StateBlock :title="t('page.notFound')" :description="t('page.notFoundDesc')" />
  </PageShell>
</template>

<script setup lang="ts">
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
