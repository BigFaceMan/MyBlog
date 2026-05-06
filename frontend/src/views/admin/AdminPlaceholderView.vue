<template>
  <AdminLayout>
    <section class="admin-placeholder">
      <header class="admin-placeholder__header">
        <p>后台</p>
        <h1>{{ pageConfig.title }}</h1>
      </header>

      <section class="admin-placeholder__body">
        <h2>{{ pageConfig.heading }}</h2>
        <p>{{ pageConfig.description }}</p>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/components/admin/AdminLayout.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const pageConfig = computed(() => {
  if (route.path.startsWith("/admin/profile")) {
    return {
      title: "个人简介管理",
      heading: "个人简介配置",
      description: "这里后续用于维护头像、昵称、简介、公告和社交链接。"
    };
  }

  return {
    title: "用户管理",
    heading: "用户权限配置",
    description: "这里后续用于查看注册用户、调整权限和管理账号状态。"
  };
});
</script>

<style scoped>
.admin-placeholder {
  display: grid;
  gap: 18px;
}

.admin-placeholder__header,
.admin-placeholder__body {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.admin-placeholder__header {
  padding: 24px 28px;
}

.admin-placeholder__header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.admin-placeholder__header h1,
.admin-placeholder__body h2,
.admin-placeholder__body p {
  margin: 0;
}

.admin-placeholder__header h1 {
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.admin-placeholder__body {
  display: grid;
  gap: 8px;
  padding: 28px;
}

.admin-placeholder__body h2 {
  color: var(--text-primary);
  font-size: 20px;
}

.admin-placeholder__body p {
  color: var(--text-secondary);
  line-height: 1.7;
}
</style>
