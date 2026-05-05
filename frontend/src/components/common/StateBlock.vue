<template>
  <div class="state-block">
    <component :is="iconComponent" class="state-block__icon" :size="34" />
    <p class="state-block__title">{{ title }}</p>
    <p v-if="description" class="state-block__description">{{ description }}</p>
    <el-button v-if="actionText" type="primary" plain @click="$emit('action')">{{ actionText }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { CircleClose, Document, Loading } from "@element-plus/icons-vue";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    type?: "empty" | "error" | "loading";
    title: string;
    description?: string;
    actionText?: string;
  }>(),
  {
    type: "empty",
    description: "",
    actionText: ""
  }
);

defineEmits<{
  action: [];
}>();

const iconComponent = computed(() => {
  if (props.type === "error") {
    return CircleClose;
  }

  if (props.type === "loading") {
    return Loading;
  }

  return Document;
});
</script>

<style scoped>
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 36px;
  color: var(--text-secondary);
  text-align: center;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.state-block__icon {
  margin-bottom: 14px;
  color: var(--primary-color);
}

.state-block__title {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
}

.state-block__description {
  max-width: 360px;
  margin: 8px 0 18px;
  line-height: 1.7;
}
</style>
